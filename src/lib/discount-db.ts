import { query } from "./db.ts";
import type { DiscountRule } from "./discounts.ts";

export interface StoredDiscount extends DiscountRule {
  id: number;
  code: string;
  note: string | null;
  createdAt: string;
}

function map(x: Record<string, unknown>): StoredDiscount {
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  return {
    id: Number(x.id),
    code: x.code as string,
    kind: x.kind as "percent" | "fixed",
    value: Number(x.value),
    minSubtotalCents: Number(x.min_subtotal_cents),
    maxUses: x.max_uses === null || x.max_uses === undefined ? null : Number(x.max_uses),
    uses: Number(x.uses),
    startsAt: iso(x.starts_at),
    expiresAt: iso(x.expires_at),
    active: !!x.active,
    note: (x.note as string | null) ?? null,
    createdAt: new Date(x.created_at as string).toISOString(),
  };
}

const COLS = `id, code, kind, value, min_subtotal_cents, max_uses, uses, starts_at, expires_at, active, note, created_at`;

export async function findDiscount(code: string): Promise<StoredDiscount | null> {
  const r = await query(`SELECT ${COLS} FROM discount_codes WHERE code = $1`, [code]);
  return r.rows[0] ? map(r.rows[0]) : null;
}

export async function listDiscounts(): Promise<StoredDiscount[]> {
  const r = await query(`SELECT ${COLS} FROM discount_codes ORDER BY created_at DESC LIMIT 300`);
  return r.rows.map(map);
}