// Seeds 5 test books using mock:// sources (no real requests). Safe to run repeatedly.
import { pool } from "../src/lib/db.ts";

const books = [
  { slug: "madarij-al-salikeen", title: "مدارج السالكين", author: "ابن القيم", src: "mock://available" },
  { slug: "zad-al-maad", title: "زاد المعاد", author: "ابن القيم", src: "mock://available" },
  { slug: "sayd-al-khatir", title: "صيد الخاطر", author: "ابن الجوزي", src: "mock://out_of_stock" },
  { slug: "talbis-iblis", title: "تلبيس إبليس", author: "ابن الجوزي", src: "mock://unknown" },
  { slug: "al-muntazam", title: "المنتظم", author: "ابن الجوزي", src: "mock://timeout" },
];

async function main() {
  for (const b of books) {
    const r = await pool.query(
      `INSERT INTO books (slug, title, author, description) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
      [b.slug, b.title, b.author, "كتاب تجريبي لاختبار نظام التوفر."],
    );
    await pool.query(
      `INSERT INTO book_sources (book_id, source_url_private, source_product_id) VALUES ($1,$2,$3)
       ON CONFLICT (book_id) DO NOTHING`,
      [r.rows[0].id, b.src, b.src.replace("mock://", "")],
    );
  }
  console.log(`seeded ${books.length} books (mock sources). Run the worker or click "Check Now" in /admin.`);
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
