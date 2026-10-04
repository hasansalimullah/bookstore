// All book queries. Public and admin shapes are separate types on purpose:
// PublicBook has NO field that could hold a source URL, and public queries never touch book_sources.
import { config } from "./config.ts";
import { query } from "./db.ts";
import { effectiveAvailability } from "./evaluate.ts";

export type Availability = "available" | "out_of_stock" | "unknown";

export interface PublicBook {
  id: number;
  slug: string;
  title: string;
  titleAr: string | null;
  author: string | null;
  description: string | null;
  category: string | null;
  edition: string | null;
  cover: string | null;
  printQuality: string | null;
  format: string | null;
  harakat: string | null;
  imageUrl: string | null;
  /** main image first, then extra images */
  images: string[];
  priceCents: number | null;
  createdAt: string | null;
  availability: Availability;
  lastChecked: string | null;
}

const PUBLIC_COLS = `id, slug, title, title_ar, author, description, category, edition, cover, print_quality, format, harakat,
  image_url, extra_images, price_cents, created_at, availability, last_checked, last_success_at`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPublic(r: any): PublicBook {
  const extra: string[] = Array.isArray(r.extra_images) ? r.extra_images : [];
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    titleAr: r.title_ar ?? null,
    author: r.author,
    description: r.description,
    category: r.category ?? null,
    edition: r.edition ?? null,
    cover: r.cover ?? null,
    printQuality: r.print_quality ?? null,
    format: r.format ?? null,
    harakat: r.harakat ?? null,
    imageUrl: r.image_url,
    images: [r.image_url, ...extra].filter((u: unknown): u is string => typeof u === "string" && u.length > 0),
    priceCents: r.price_cents === null || r.price_cents === undefined ? null : Number(r.price_cents),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    availability: effectiveAvailability(r.availability, r.last_success_at, config.staleAfterMinutes),
    lastChecked: r.last_checked ? new Date(r.last_checked).toISOString() : null,
  };
}

export interface BookFilter {
  q?: string;
  /** one or more words separated by "|"; matches books whose category contains any of them */
  category?: string;
  sort?: "new" | "title";
  limit?: number;
}

const likeEscape = (s: string) => `%${s.replace(/[%_\\]/g, "\\$&")}%`;

export async function listBooks(f: BookFilter = {}): Promise<PublicBook[]> {
  const where: string[] = ["published"];
  const params: unknown[] = [];
  const q = f.q?.trim();
  if (q) {
    params.push(likeEscape(q));
    where.push(`(title ILIKE $${params.length} OR title_ar ILIKE $${params.length} OR author ILIKE $${params.length})`);
  }
  const cats = (f.category ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  if (cats.length) {
    params.push(cats.map(likeEscape));
    where.push(`category ILIKE ANY($${params.length}::text[])`);
  }
  const order = f.sort === "title" ? "title ASC" : "created_at DESC";
  const limit = Math.min(Math.max(f.limit ?? 200, 1), 200);
  const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM books WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ${limit}`, params);
  return rows.map(toPublic);
}

/** Kept for the public JSON API. */
export async function listPublicBooks(search?: string): Promise<PublicBook[]> {
  return listBooks({ q: search });
}

/** A home/product-page carousel: books of a category, or the newest books if that category has none yet. */
export async function listSection(category: string, limit = 10): Promise<PublicBook[]> {
  const inCat = await listBooks({ category, limit });
  return inCat.length ? inCat : listBooks({ sort: "new", limit });
}

export async function getPublicBook(slug: string): Promise<PublicBook | null> {
  const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM books WHERE published AND slug = $1`, [slug]);
  return rows[0] ? toPublic(rows[0]) : null;
}

// ---------------- ADMIN ONLY ----------------

export interface AdminBook extends PublicBook {
  published: boolean;
  sourceUrl: string; // private — only ever returned by /api/admin/*
  sourceProductId: string | null;
  monitoringEnabled: boolean;
  lastCheckStatus: "ok" | "error" | null;
  lastError: string | null;
  consecutiveFailures: number;
  nextCheckAt: string | null;
  storedAvailability: Availability;
  extraImages: string[];
  authorId: number | null;
}

const ADMIN_SELECT = `
  SELECT b.*, s.source_url_private, s.source_product_id, s.monitoring_enabled, s.last_check_status,
         s.last_error, s.consecutive_failures, s.next_check_at
    FROM books b LEFT JOIN book_sources s ON s.book_id = b.id`;

function toAdmin(r: any): AdminBook {
  return {
    ...toPublic(r),
    storedAvailability: r.availability,
    published: r.published,
    extraImages: Array.isArray(r.extra_images) ? r.extra_images : [],
    authorId: r.author_id === null || r.author_id === undefined ? null : Number(r.author_id),
    sourceUrl: r.source_url_private ?? "",
    sourceProductId: r.source_product_id,
    monitoringEnabled: !!r.monitoring_enabled,
    lastCheckStatus: r.last_check_status,
    lastError: r.last_error,
    consecutiveFailures: r.consecutive_failures ?? 0,
    nextCheckAt: r.next_check_at ? new Date(r.next_check_at).toISOString() : null,
  };
}

export async function listAdminBooks(): Promise<AdminBook[]> {
  const { rows } = await query(`${ADMIN_SELECT} ORDER BY b.created_at DESC`);
  return rows.map(toAdmin);
}

/** authorId = number → that author's books; "none" → books without an author. */
export async function listAdminBooksByAuthor(authorId: number | "none"): Promise<AdminBook[]> {
  const { rows } =
    authorId === "none"
      ? await query(`${ADMIN_SELECT} WHERE b.author_id IS NULL ORDER BY b.created_at DESC`)
      : await query(`${ADMIN_SELECT} WHERE b.author_id = $1 ORDER BY b.created_at DESC`, [authorId]);
  return rows.map(toAdmin);
}

export async function getAdminBook(id: number): Promise<AdminBook | null> {
  const { rows } = await query(`${ADMIN_SELECT} WHERE b.id = $1`, [id]);
  return rows[0] ? toAdmin(rows[0]) : null;
}

export interface BookInput {
  title: string;
  titleAr?: string | null;
  author?: string | null;
  description?: string | null;
  category?: string | null;
  edition?: string | null;
  cover?: string | null;
  printQuality?: string | null;
  format?: string | null;
  harakat?: string | null;
  imageUrl?: string | null;
  extraImages?: string[];
  priceCents?: number | null;
  authorId?: number | null;
  slug: string;
  published?: boolean;
}

const COLUMN_OF: Record<string, string> = {
  title: "title", titleAr: "title_ar", author: "author", description: "description", category: "category",
  edition: "edition", cover: "cover", printQuality: "print_quality", format: "format", harakat: "harakat",
  imageUrl: "image_url", extraImages: "extra_images", priceCents: "price_cents", authorId: "author_id", slug: "slug", published: "published",
};

export async function createBook(input: BookInput, sourceUrl: string, sourceProductId: string | null): Promise<number> {
  const keys = Object.keys(COLUMN_OF).filter((k) => (input as unknown as Record<string, unknown>)[k] !== undefined);
  const vals = keys.map((k) => {
    const v = (input as unknown as Record<string, unknown>)[k];
    return v === "" ? null : v;
  });
  const b = await query(
    `INSERT INTO books (${keys.map((k) => COLUMN_OF[k]).join(", ")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
    vals,
  );
  const id = Number(b.rows[0].id);
  await query(`INSERT INTO book_sources (book_id, source_url_private, source_product_id) VALUES ($1,$2,$3)`, [id, sourceUrl, sourceProductId]);
  return id;
}

export async function updateBook(
  id: number,
  input: Partial<BookInput> & { sourceUrl?: string; sourceProductId?: string | null; monitoringEnabled?: boolean },
): Promise<void> {
  const rec = input as unknown as Record<string, unknown>;
  const keys = Object.keys(COLUMN_OF).filter((k) => rec[k] !== undefined);
  if (keys.length) {
    const sets = keys.map((k, i) => `${COLUMN_OF[k]} = $${i + 2}`);
    const vals = keys.map((k) => (rec[k] === "" && k !== "title" && k !== "slug" ? null : rec[k]));
    await query(`UPDATE books SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`, [id, ...vals]);
  }
  if (input.sourceUrl !== undefined || input.monitoringEnabled !== undefined) {
    await query(
      `UPDATE book_sources SET
          source_url_private = COALESCE($2, source_url_private),
          source_product_id = CASE WHEN $2::text IS NULL THEN source_product_id ELSE $3 END,
          monitoring_enabled = COALESCE($4, monitoring_enabled),
          next_check_at = CASE WHEN $2::text IS NULL THEN next_check_at ELSE now() END,
          updated_at = now()
        WHERE book_id = $1`,
      [id, input.sourceUrl ?? null, input.sourceProductId ?? null, input.monitoringEnabled ?? null],
    );
  }
}

export async function deleteBook(id: number): Promise<boolean> {
  const r = await query(`DELETE FROM books WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}

export async function getLogs(bookId: number, limit = 50) {
  const { rows } = await query(
    `SELECT id, checked_at, trigger, outcome, parsed_status, http_status, selector_found, detected_text, reason, error_message, duration_ms, debug
       FROM check_logs WHERE book_id = $1 ORDER BY checked_at DESC LIMIT $2`,
    [bookId, limit],
  );
  return rows;
}
