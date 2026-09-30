// Minimal Stripe client using fetch (no SDK). Server-only.
import { createHmac, timingSafeEqual } from "node:crypto";

/** Encodes nested objects/arrays into Stripe's bracket form-encoding: a[b][0][c]=1 */
export function encodeForm(obj: unknown, prefix = "", out: string[] = []): string {
  if (obj === null || obj === undefined) return out.join("&");
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => encodeForm(v, `${prefix}[${i}]`, out));
  } else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) encodeForm(v, prefix ? `${prefix}[${k}]` : k, out);
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  }
  return out.join("&");
}

export interface CheckoutLine {
  name: string;
  unitAmountCents: number;
  quantity: number;
}

export async function createCheckoutSession(opts: {
  secretKey: string;
  currency: string;
  lines: CheckoutLine[];
  customerEmail: string;
  clientReferenceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  const body = encodeForm({
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    customer_email: opts.customerEmail,
    client_reference_id: opts.clientReferenceId,
    line_items: opts.lines.map((l) => ({
      quantity: l.quantity,
      price_data: { currency: opts.currency, unit_amount: l.unitAmountCents, product_data: { name: l.name.slice(0, 250) } },
    })),
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) throw new Error(`Stripe error: ${data.error?.message ?? res.status}`);
  return { id: data.id, url: data.url };
}

/** Verifies a Stripe-Signature header (t=timestamp,v1=hmac). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300, nowMs = Date.now()): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || sigs.length === 0 || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return sigs.some((s) => {
    const given = Buffer.from(s);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
