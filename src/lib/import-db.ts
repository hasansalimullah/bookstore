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

    const col = (rows: PlannedRow[], f: (p: PlannedRow) => unknown) => rows.map((p) => f(p) ?? null);

    if (creates.length) {
      const ins = await client.query(
        `INSERT INTO books (slug, title, title_ar, author, description, category, edition, cover, print_quality, format, harakat, image_url, extra_images, price_cents)
         SELECT t.slug, t.title, t.title_ar, t.author, t.description, t.category, t.edition, t.cover, t.print_quality, t.format, t.harakat,
                t.image_url, COALESCE(string_to_array(NULLIF(t.extra, ''), E'\n'), '{}'), t.price
           FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::int[])
                AS t(slug, title, title_ar, author, description, category, edition, cover, print_quality, format, harakat, image_url, extra, price)
         RETURNING id, slug`,
        [col(creates, (p) => p.slug), col(creates, (p) => p.title), col(creates, (p) => p.titleAr), col(creates, (p) => p.author), col(creates, (p) => p.description),
         col(creates, (p) => p.category), col(creates, (p) => p.edition), col(creates, (p) => p.cover), col(creates, (p) => p.printQuality), col(creates, (p) => p.format),
         col(creates, (p) => p.harakat), col(creates, (p) => p.imageUrl), col(creates, (p) => p.extraImages), col(creates, (p) => p.priceCents)],
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
            title_ar = COALESCE(NULLIF(v.title_ar, ''), b.title_ar),
            author = COALESCE(NULLIF(v.author, ''), b.author),
            description = COALESCE(NULLIF(v.description, ''), b.description),
            category = COALESCE(NULLIF(v.category, ''), b.category),
            edition = COALESCE(NULLIF(v.edition, ''), b.edition),
            cover = COALESCE(NULLIF(v.cover, ''), b.cover),
            print_quality = COALESCE(NULLIF(v.print_quality, ''), b.print_quality),
            format = COALESCE(NULLIF(v.format, ''), b.format),
            harakat = COALESCE(NULLIF(v.harakat, ''), b.harakat),
            image_url = COALESCE(NULLIF(v.image_url, ''), b.image_url),
            extra_images = COALESCE(string_to_array(NULLIF(v.extra, ''), E'\n'), b.extra_images),
            price_cents = COALESCE(v.price, b.price_cents),
            updated_at = now()
           FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::int[])
                AS v(id, title, title_ar, author, description, category, edition, cover, print_quality, format, harakat, image_url, extra, price)
          WHERE b.id = v.id`,
        [col(updates, (p) => p.existingId), col(updates, (p) => p.title), col(updates, (p) => p.titleAr), col(updates, (p) => p.author), col(updates, (p) => p.description),
         col(updates, (p) => p.category), col(updates, (p) => p.edition), col(updates, (p) => p.cover), col(updates, (p) => p.printQuality), col(updates, (p) => p.format),
         col(updates, (p) => p.harakat), col(updates, (p) => p.imageUrl), col(updates, (p) => p.extraImages), col(updates, (p) => p.priceCents)],
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
