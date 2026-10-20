import { config } from "./config.ts";
import { query } from "./db.ts";
import { effectiveAvailability } from "./evaluate.ts";
import { listBooks, listBooksByIds, type PublicBook } from "./books.ts";
import type { CatalogRow } from "./catalog.ts";

/** Light columns of every published book; filtering and counting then happen in memory (fine up to a few thousand books). */
export async function listCatalogRows(): Promise<CatalogRow[]> {
  const { rows } = await query(
    `SELECT id, title, title_ar, author, category, edition, cover, harakat, price_cents, availability, last_success_at, created_at
       FROM books WHERE published ORDER BY created_at DESC LIMIT 5000`,
  );
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title as string,
    titleAr: (r.title_ar as string | null) ?? null,
    author: (r.author as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    edition: (r.edition as string | null) ?? null,
    cover: (r.cover as string | null) ?? null,
    harakat: (r.harakat as string | null) ?? null,
    priceCents: r.price_cents === null || r.price_cents === undefined ? null : Number(r.price_cents),
    availability: effectiveAvailability(r.availability, r.last_success_at, config.staleAfterMinutes),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : null,
  }));
}

/** Most-bought books (paid orders) in a category scope; falls back to the newest books while there are no sales yet. */
export async function bestSellers(scope: string, limit = 10): Promise<PublicBook[]> {
  const words = scope.split("|").map((s) => s.trim()).filter(Boolean).map((s) => `%${s.replace(/[%_\\]/g, "\\$&")}%`);
  const params: unknown[] = [];
  let catSql = "";
  if (words.length) {
    params.push(words);
    catSql = `AND b.category ILIKE ANY($1::text[])`;
  }
  const { rows } = await query(
    `SELECT b.id FROM books b
       JOIN order_items oi ON oi.book_id = b.id
       JOIN orders o ON o.id = oi.order_id
      WHERE b.published AND o.status IN ('paid','ordered_from_supplier','shipped') ${catSql}
      GROUP BY b.id ORDER BY SUM(oi.quantity) DESC, MAX(o.created_at) DESC LIMIT ${Math.min(limit, 20)}`,
    params,
  );
  const sold = await listBooksByIds(rows.map((r) => Number(r.id)));
  if (sold.length >= 4) return sold;
  return listBooks({ category: scope || undefined, sort: "new", limit });
}