import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { effectiveAvailability } from "@/lib/evaluate";
import { cancelPendingOrder, createOrder, setStripeSession } from "@/lib/orders";
import { computeTotals, normalizeCart, validateCustomer } from "@/lib/shop";
import { createCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Tiny per-instance throttle: 10 orders / 10 min per IP.
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 10) return Response.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = (await req.json().catch(() => ({}))) as { items?: unknown; customer?: unknown };
  const cart = normalizeCart(body.items);
  if (!cart.length) return Response.json({ error: "Your cart is empty." }, { status: 400 });
  const cust = validateCustomer(body.customer);
  if (!cust.ok) return Response.json({ error: "Please fix the highlighted fields.", fields: cust.errors }, { status: 400 });
  if (config.paymentMode === "stripe" && !config.stripeSecretKey) {
    return Response.json({ error: "Payments are not set up yet." }, { status: 503 });
  }

  try {
    // Server decides prices and availability — nothing from the browser is trusted.
    const { rows } = await query(
      `SELECT id, title, price_cents, availability, last_success_at FROM books WHERE published AND id = ANY($1::bigint[])`,
      [cart.map((c) => c.bookId)],
    );
    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    const problems: string[] = [];
    const lines = cart.flatMap((c) => {
      const r = byId.get(c.bookId);
      if (!r) {
        problems.push("An item in your cart no longer exists.");
        return [];
      }
      const avail = effectiveAvailability(r.availability, r.last_success_at, config.staleAfterMinutes);
      if (avail !== "available" || r.price_cents === null) {
        problems.push(`"${r.title}" is not available to order right now.`);
        return [];
      }
      return [{ bookId: c.bookId, title: r.title as string, unitPriceCents: Number(r.price_cents), qty: c.qty }];
    });
    if (problems.length) return Response.json({ error: problems.join(" ") }, { status: 409 });

    const totals = computeTotals(lines, config.shippingFlatCents);
    const { orderId, publicId } = await createOrder(cust.value, lines, totals);

    if (config.paymentMode === "manual") return Response.json({ url: `/order/${publicId}` });

    const origin = config.siteUrl || new URL(req.url).origin;
    try {
      const stripeLines = lines.map((l) => ({ name: l.title, unitAmountCents: l.unitPriceCents, quantity: l.qty }));
      if (totals.shippingCents > 0) stripeLines.push({ name: "Shipping", unitAmountCents: totals.shippingCents, quantity: 1 });
      const session = await createCheckoutSession({
        secretKey: config.stripeSecretKey,
        currency: config.currency,
        lines: stripeLines,
        customerEmail: cust.value.email,
        clientReferenceId: publicId,
        successUrl: `${origin}/order/${publicId}?paid=1`,
        cancelUrl: `${origin}/cart`,
      });
      await setStripeSession(orderId, session.id);
      return Response.json({ url: session.url });
    } catch (e) {
      console.error("[checkout] stripe failed:", e instanceof Error ? e.message : e);
      await cancelPendingOrder(orderId);
      return Response.json({ error: "Could not start payment. Please try again." }, { status: 502 });
    }
  } catch (e) {
    console.error("[checkout] failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
