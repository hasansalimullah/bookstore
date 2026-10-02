// Author records (admin only). The public site keeps using books.author (text) for display.
import { query } from "./db.ts";

export interface AuthorRow {
  id: number;
  name: string;
  books: number;
}

export async function listAuthors(): Promise<{ authors: AuthorRow[]; unassigned: number }> {
  const { rows } = await query(
    `SELECT a.id, a.name, count(b.id) AS books FROM authors a LEFT JOIN books b ON b.author_id = a.id GROUP BY a.id ORDER BY lower(a.name)`,
  );
  const u = await query(`SELECT count(*) AS n FROM books WHERE author_id IS NULL`);
  return { authors: rows.map((r) => ({ id: Number(r.id), name: r.name as string, books: Number(r.books) })), unassigned: Number(u.rows[0]?.n ?? 0) };
}

export async function getAuthor(id: number): Promise<{ id: number; name: string } | null> {
  const { rows } = await query(`SELECT id, name FROM authors WHERE id = $1`, [id]);
  return rows[0] ? { id: Number(rows[0].id), name: rows[0].name as string } : null;
}

/** Case-insensitive find-or-create. */
export async function ensureAuthor(rawName: string): Promise<{ id: number; name: string } | null> {
  const name = rawName.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!name) return null;
  const found = await query(`SELECT id, name FROM authors WHERE lower(name) = lower($1)`, [name]);
  if (found.rows[0]) return { id: Number(found.rows[0].id), name: found.rows[0].name as string };
  const ins = await query(`INSERT INTO authors (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, name`, [name]);
  if (ins.rows[0]) return { id: Number(ins.rows[0].id), name: ins.rows[0].name as string };
  const again = await query(`SELECT id, name FROM authors WHERE lower(name) = lower($1)`, [name]);
  return again.rows[0] ? { id: Number(again.rows[0].id), name: again.rows[0].name as string } : null;
}

export async function renameAuthor(id: number, rawName: string): Promise<boolean> {
  const name = rawName.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!name) return false;
  const r = await query(`UPDATE authors SET name = $2 WHERE id = $1`, [id, name]);
  if (!(r.rowCount ?? 0)) return false;
  await query(`UPDATE books SET author = $2, updated_at = now() WHERE author_id = $1`, [id, name]);
  return true;
}

/** Deleting an author keeps the books (they become "No author" and keep their display name). */
export async function deleteAuthor(id: number): Promise<boolean> {
  const r = await query(`DELETE FROM authors WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}
