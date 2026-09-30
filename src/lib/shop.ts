// Pure shop helpers (no DB, no network) → unit-tested.

export const MAX_QTY = 10;
export const MAX_LINES = 20;

export function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** "12.5" / "12.50" / "$12.50" → 1250. Returns null for empty/invalid/negative. */
export function parseMoneyToCents(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) && input >= 0 ? Math.round(input * 100) : null;
  if (typeof input !== "string") return null;
  const s = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(parseFloat(s) * 100);
  return cents >= 0 && cents <= 10_000_000 ? cents : null;
}

export interface CartItem {
  bookId: number;
  qty: number;
}

/** Sanitizes untrusted cart input: valid ids, qty 1..MAX_QTY, merged duplicates, max lines. */
export function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const map = new Map<number, number>();
  for (const it of raw) {
    const id = Number((it as { bookId?: unknown })?.bookId);
    const qty = Math.floor(Number((it as { qty?: unknown })?.qty));
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qty) || qty < 1) continue;
    map.set(id, Math.min(MAX_QTY, (map.get(id) ?? 0) + qty));
  }
  return [...map.entries()].slice(0, MAX_LINES).map(([bookId, qty]) => ({ bookId, qty }));
}

export function computeTotals(lines: { unitPriceCents: number; qty: number }[], shippingFlatCents: number) {
  const subtotal = lines.reduce((n, l) => n + l.unitPriceCents * l.qty, 0);
  const shipping = lines.length ? shippingFlatCents : 0;
  return { subtotalCents: subtotal, shippingCents: shipping, totalCents: subtotal + shipping };
}

export interface Customer {
  name: string;
  email: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
}

export function validateCustomer(raw: unknown): { ok: true; value: Customer } | { ok: false; errors: Record<string, string> } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof r[k] === "string" ? (r[k] as string).trim().slice(0, max) : "");
  const v = {
    name: str("name", 120),
    email: str("email", 200),
    phone: str("phone", 40),
    line1: str("line1", 200),
    line2: str("line2", 200),
    city: str("city", 100),
    region: str("region", 100),
    postalCode: str("postalCode", 20),
    country: str("country", 100),
  };
  const errors: Record<string, string> = {};
  if (v.name.length < 2) errors.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errors.email = "Enter a valid email";
  if (v.line1.length < 3) errors.line1 = "Enter your street address";
  if (v.city.length < 2) errors.city = "Enter your city";
  if (v.country.length < 2) errors.country = "Enter your country";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: v.name,
      email: v.email,
      phone: v.phone || null,
      line1: v.line1,
      line2: v.line2 || null,
      city: v.city,
      region: v.region || null,
      postalCode: v.postalCode || null,
      country: v.country,
    },
  };
}
