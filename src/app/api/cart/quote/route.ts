import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { effectiveAvailability } from "@/lib/evaluate";
import { checkDiscount, capDiscount, normalizeCode } from "@/lib/discounts";
import { findDiscount } from "@/lib/discount-db";
import { computeTotals, normalizeCart } from "@/lib/shop";

export const dynamic = "force-dynamic";

// PUBLIC. Returns current title/price/availability for cart items (+ discount preview). Never touches book_sources.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { items?: unknown; code?: unknown };
  const cart = normalizeCart(body.items);
  const empty = { lines: [], totals: computeTotals([], 0), currency: config.currency, discount: null, discountError: null };
  if (!cart.length) return Response.json(empty);
  try {
    const { rows } = await query(
      `SELECT id, slug, title, author, image_url, price_cents, availability, last_success_at FROM books WHERE published AND id = ANY($1::bigint[])`,
      [cart.map((c) => c.bookId)],
    );
    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    const lines = cart.flatMap((c) => {
      const r = byId.get(c.bookId);
      if (!r) return [];
      const availability = effectiveAvailability(r.availability, r.last_success_at, config.staleAfterMinutes);
      return [{
        bookId: c.bookId,
        qty: c.qty,
        slug: r.slug as string,
        title: r.title as string,
        author: (r.author as string | null) ?? null,
        imageUrl: (r.image_url as string | null) ?? null,
        unitPriceCents: r.price_cents === null ? null : Number(r.price_cents),
        availability,
        purchasable: availability === "available" && r.price_cents !== null,
      }];
    });
    const priced = lines.filter((l) => l.purchasable).map((l) => ({ unitPriceCents: l.unitPriceCents as number, qty: l.qty }));
    const subtotal = priced.reduce((n, l) => n + l.unitPriceCents * l.qty, 0);

    let discount: { code: string; cents: number } | null = null;
    let discountError: string | null = null;
    const rawCode = typeof body.code === "string" ? body.code.trim() : "";
    if (rawCode) {
      const code = normalizeCode(rawCode);
      const rule = code ? await findDiscount(code) : null;
      if (!rule) discountError = "That discount code is not valid.";
      else {
        const chk = checkDiscount(rule, subtotal);
        if (!chk.ok) discountError = chk.reason;
        else discount = { code: rule.code, cents: capDiscount(chk.discountCents, subtotal, priced.length ? config.shippingFlatCents : 0) };
      }
    }
    return Response.json({ lines, totals: computeTotals(priced, config.shippingFlatCents, discount?.cents ?? 0), currency: config.currency, discount, discountError });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 });
  }
}