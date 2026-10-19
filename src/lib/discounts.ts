export interface DiscountRule {
  kind: "percent" | "fixed";
  value: number; // percent 1..100, or cents for "fixed"
  minSubtotalCents: number;
  maxUses: number | null;
  uses: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
}

export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,32}$/.test(c) ? c : null;
}

export function discountAmount(rule: Pick<DiscountRule, "kind" | "value">, subtotalCents: number): number {
  const raw = rule.kind === "percent" ? Math.floor((subtotalCents * Math.min(100, rule.value)) / 100) : rule.value;
  return Math.max(0, Math.min(raw, subtotalCents));
}

export type CodeCheck = { ok: true; discountCents: number } | { ok: false; reason: string };

export function checkDiscount(rule: DiscountRule, subtotalCents: number, nowMs = Date.now()): CodeCheck {
  if (!rule.active) return { ok: false, reason: "This code is no longer active." };
  if (rule.startsAt && Date.parse(rule.startsAt) > nowMs) return { ok: false, reason: "This code is not active yet." };
  if (rule.expiresAt && Date.parse(rule.expiresAt) < nowMs) return { ok: false, reason: "This code has expired." };
  if (rule.maxUses !== null && rule.uses >= rule.maxUses) return { ok: false, reason: "This code has been used up." };
  if (subtotalCents < rule.minSubtotalCents) return { ok: false, reason: `This code needs a subtotal of at least $${(rule.minSubtotalCents / 100).toFixed(2)}.` };
  const d = discountAmount(rule, subtotalCents);
  return d > 0 ? { ok: true, discountCents: d } : { ok: false, reason: "This code does not apply to your cart." };
}

/** Keeps the payable total at or above Stripe's minimum charge (50 cents). */
export function capDiscount(discountCents: number, subtotalCents: number, shippingCents: number, minTotalCents = 50): number {
  return Math.max(0, Math.min(discountCents, subtotalCents + shippingCents - minTotalCents));
}

export function describeDiscount(kind: string, value: number): string {
  return kind === "percent" ? `${value}% off` : `$${(value / 100).toFixed(2)} off`;
}