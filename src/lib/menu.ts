import { site } from "@/content/site";
import { query } from "./db.ts";
import { buildTree, groupAuthors, type AuthorInfo, type MenuData } from "./menu-tree.ts";

let cache: { at: number; data: MenuData } | null = null;

export async function getMenuData(): Promise<MenuData> {
  if (cache && Date.now() - cache.at < 300_000) return cache.data;
  const cats = await query(`SELECT category, count(*)::int AS n FROM books WHERE published AND category IS NOT NULL AND category <> '' GROUP BY category`);
  const auth = await query(
    `SELECT a.name, a.era, a.tags, a.featured, count(b.id)::int AS n
       FROM authors a JOIN books b ON b.author_id = a.id AND b.published
      GROUP BY a.id`,
  );
  const authors: AuthorInfo[] = auth.rows.map((r) => ({
    name: r.name as string,
    era: (r.era as string | null) ?? null,
    tags: (r.tags as string[] | null) ?? [],
    featured: !!r.featured,
    books: Number(r.n),
  }));
  const data: MenuData = {
    tree: buildTree(cats.rows.map((r) => ({ category: r.category as string, n: Number(r.n) }))),
    authors: groupAuthors(authors, site.authorEras, site.authorTags),
  };
  cache = { at: Date.now(), data };
  return data;
}