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
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  availability: Availability;
  lastChecked: string | null;
}

const PUBLIC_COLS = `id, slug, title, author, description, image_url, price_cents, availability, last_checked, last_success_at`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPublic(r: any): PublicBook {
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    author: r.author,
    description: r.description,
    imageUrl: r.image_url,
    priceCents: r.price_cents === null || r.price_cents === undefined ? null : Number(r.price_cents),
    availability: effectiveAvailability(r.availability, r.last_success_at, config.staleAfterMinutes),
    lastChecked: r.last_checked ? new Date(r.last_checked).toISOString() : null,
  };
}

export async function listPublicBooks(search?: string): Promise<PublicBook[]> {
  const q = search?.trim();
  const { rows } = q
    ? await query(
        `SELECT ${PUBLIC_COLS} FROM books WHERE published AND (title ILIKE $1 OR author ILIKE $1) ORDER BY created_at DESC LIMIT 200`,
        [`%${q.replace(/[%_\\]/g, "\\$&")}%`],
      )
    : await query(`SELECT ${PUBLIC_COLS} FROM books WHERE published ORDER BY created_at DESC LIMIT 200`);
  return rows.map(toPublic);
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

export async function getAdminBook(id: number): Promise<AdminBook | null> {
  const { rows } = await query(`${ADMIN_SELECT} WHERE b.id = $1`, [id]);
  return rows[0] ? toAdmin(rows[0]) : null;
}

export interface BookInput {
  title: string;
  author?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  priceCents?: number | null;
  slug: string;
  published?: boolean;
}

export async function createBook(input: BookInput, sourceUrl: string, sourceProductId: string | null): Promise<number> {
  const b = await query(
    `INSERT INTO books (slug, title, author, description, image_url, price_cents, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [input.slug, input.title, input.author || null, input.description || null, input.imageUrl || null, input.priceCents ?? null, input.published ?? true],
  );
  const id = Number(b.rows[0].id);
  await query(`INSERT INTO book_sources (book_id, source_url_private, source_product_id) VALUES ($1,$2,$3)`, [id, sourceUrl, sourceProductId]);
  return id;
}

export async function updateBook(
  id: number,
  input: Partial<BookInput> & { sourceUrl?: string; sourceProductId?: string | null; monitoringEnabled?: boolean },
): Promise<void> {
  await query(
    `UPDATE books SET
        title = COALESCE($2, title), author = COALESCE($3, author), description = COALESCE($4, description),
        image_url = COALESCE($5, image_url), slug = COALESCE($6, slug), published = COALESCE($7, published),
        price_cents = COALESCE($8, price_cents),
        updated_at = now()
      WHERE id = $1`,
    [id, input.title ?? null, input.author ?? null, input.description ?? null, input.imageUrl ?? null, input.slug ?? null, input.published ?? null, input.priceCents ?? null],
  );
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
