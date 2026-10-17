// Order queries. Orders hold customer PII → only admin routes and the customer's own unguessable order page use these.
import { randomBytes } from "node:crypto";
import { config } from "./config.ts";
import { pool, query } from "./db.ts";
import type { Customer } from "./shop.ts";

export const ORDER_STATUSES = ["pending_payment", "paid", "ordered_from_supplier", "shipped", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface NewOrderLine {
  bookId: number;
  title: string;
  unitPriceCents: number;
  qty: number;
}

export async function createOrder(customer: Customer, lines: NewOrderLine[], totals: { subtotalCents: number; shippingCents: number; totalCents: number }) {
  const publicId = randomBytes(12).toString("base64url");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const o = await client.query(
      `INSERT INTO orders (public_id, email, name, phone, ship_line1, ship_line2, ship_city, ship_region, ship_postal_code, ship_country,
                           currency, subtotal_cents, shipping_cents, total_cents, payment_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [publicId, customer.email, customer.name, customer.phone, customer.line1, customer.line2, customer.city, customer.region, customer.postalCode, customer.country,
       config.currency, totals.subtotalCents, totals.shippingCents, totals.totalCents, config.paymentMode],
    );
    const orderId = Number(o.rows[0].id);
    for (const l of lines) {
      await client.query(`INSERT INTO order_items (order_id, book_id, title, unit_price_cents, quantity) VALUES ($1,$2,$3,$4,$5)`, [orderId, l.bookId, l.title, l.unitPriceCents, l.qty]);
    }
    await client.query("COMMIT");
    return { orderId, publicId };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function setStripeSession(orderId: number, sessionId: string) {
  await query(`UPDATE orders SET stripe_session_id = $2, updated_at = now() WHERE id = $1`, [orderId, sessionId]);
}

export async function cancelPendingOrder(orderId: number) {
  await query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1 AND status = 'pending_payment'`, [orderId]);
}

/** Customer-facing view: NO address, email or admin notes. */
export async function getPublicOrder(publicId: string) {
  const o = await query(`SELECT id, public_id, status, currency, subtotal_cents, shipping_cents, total_cents, created_at, tracking_info FROM orders WHERE public_id = $1`, [publicId]);
  if (!o.rows[0]) return null;
  const items = await query(`SELECT title, unit_price_cents, quantity FROM order_items WHERE order_id = $1 ORDER BY id`, [o.rows[0].id]);
  return { ...o.rows[0], items: items.rows };
}

/** Idempotent: only moves pending_payment → paid. Verifies the amount Stripe collected matches our order total. */
export async function markPaidBySession(opts: { publicId: string; sessionId: string; amountTotal: number; currency: string; paymentIntent: string | null }) {
  const r = await query(
    `UPDATE orders SET status = 'paid', paid_at = now(), stripe_session_id = COALESCE(stripe_session_id, $2), stripe_payment_intent = $5, updated_at = now()
      WHERE public_id = $1 AND status = 'pending_payment' AND total_cents = $3 AND currency = $4`,
    [opts.publicId, opts.sessionId, opts.amountTotal, opts.currency.toLowerCase(), opts.paymentIntent],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function cancelBySession(publicId: string) {
  await query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE public_id = $1 AND status = 'pending_payment'`, [publicId]);
}

// ---------------- ADMIN ----------------

export async function listOrders(status?: string) {
  const r = status
    ? await query(`SELECT id, public_id, status, name, email, ship_country, total_cents, currency, created_at FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT 200`, [status])
    : await query(`SELECT id, public_id, status, name, email, ship_country, total_cents, currency, created_at FROM orders ORDER BY created_at DESC LIMIT 200`);
  return r.rows;
}

export async function getAdminOrder(id: number) {
  const o = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!o.rows[0]) return null;
  // Includes the private supplier link so you can buy the book quickly. Admin only.
  const items = await query(
    `SELECT i.id, i.book_id, i.title, i.unit_price_cents, i.quantity, s.source_url_private AS supplier_url, b.availability
       FROM order_items i
       LEFT JOIN book_sources s ON s.book_id = i.book_id
       LEFT JOIN books b ON b.id = i.book_id
      WHERE i.order_id = $1 ORDER BY i.id`,
    [id],
  );
  return { ...o.rows[0], items: items.rows };
}

export async function updateOrder(id: number, patch: { status?: OrderStatus; adminNotes?: string; trackingInfo?: string }) {
  await query(
    `UPDATE orders SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes), tracking_info = COALESCE($4, tracking_info), updated_at = now() WHERE id = $1`,
    [id, patch.status ?? null, patch.adminNotes ?? null, patch.trackingInfo ?? null],
  );
}
