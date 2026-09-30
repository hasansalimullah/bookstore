// Applies an import plan in ONE transaction on ONE connection with a fixed number of queries
// (important on Cloudflare Workers, where connections and subrequests are limited).
import { pool, query } from "./db.ts";
import { urlKey, type ExistingBook, type PlannedRow } from "./import-plan.ts";

export async function loadExisting(): Promise<ExistingBook[]> {
  const { rows } = await query(`SELECT b.id, b.slug, s.source_url_private FROM books b LEFT JOIN book_sources s ON s.book_id = b.id`);
  return rows.map((r) => {
    let key: string | null = null;
    try {
      key = r.source_url_private ? urlKey(new URL(r.source_url_private)) : null;
    } catch {
      key = null;
    }
    return { id: Number(r.id), slug: r.slug as string, urlKey: key };
  });
}

export async function applyImport(plan: PlannedRow[]): Promise<{ created: number; updated: number }> {
  const creates = plan.filter((p) => p.action === "create");
  const updates = plan.filter((p) => p.action === "update");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (creates.length) {
      const ins = await client.query(
        `INSERT INTO books (slug, title, author, description, image_url, price_cents)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[])
         RETURNING id, slug`,
        [creates.map((p) => p.slug), creates.map((p) => p.title), creates.map((p) => p.author ?? null), creates.map((p) => p.description ?? null), creates.map((p) => p.imageUrl ?? null), creates.map((p) => p.priceCents ?? null)],
      );
      const idBySlug = new Map<string, number>(ins.rows.map((r) => [r.slug as string, Number(r.id)]));
      await client.query(
        `INSERT INTO book_sources (book_id, source_url_private, source_product_id)
         SELECT * FROM unnest($1::bigint[], $2::text[], $3::text[])`,
        [creates.map((p) => idBySlug.get(p.slug as string)), creates.map((p) => p.sourceUrl), creates.map((p) => p.sourceProductId ?? null)],
      );
    }

    if (updates.length) {
      // Empty cells keep the existing value.
      await client.query(
        `UPDATE books b SET
            title = COALESCE(NULLIF(v.title, ''), b.title),
            author = COALESCE(NULLIF(v.author, ''), b.author),
            description = COALESCE(NULLIF(v.description, ''), b.description),
            image_url = COALESCE(NULLIF(v.image_url, ''), b.image_url),
            price_cents = COALESCE(v.price, b.price_cents),
            updated_at = now()
           FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[])
                AS v(id, title, author, description, image_url, price)
          WHERE b.id = v.id`,
        [updates.map((p) => p.existingId), updates.map((p) => p.title), updates.map((p) => p.author ?? null), updates.map((p) => p.description ?? null), updates.map((p) => p.imageUrl ?? null), updates.map((p) => p.priceCents ?? null)],
      );
    }

    await client.query("COMMIT");
    return { created: creates.length, updated: updates.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
