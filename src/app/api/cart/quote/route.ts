import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { effectiveAvailability } from "@/lib/evaluate";
import { computeTotals, normalizeCart } from "@/lib/shop";

export const dynamic = "force-dynamic";

// PUBLIC. Returns current title/price/availability for cart items. Never touches book_sources.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { items?: unknown };
  const cart = normalizeCart(body.items);
  if (!cart.length) return Response.json({ lines: [], totals: computeTotals([], 0), currency: config.currency });
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
    return Response.json({ lines, totals: computeTotals(priced, config.shippingFlatCents), currency: config.currency });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 });
  }
}
