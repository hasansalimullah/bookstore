import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { normalizeCode } from "@/lib/discounts";
import { parseMoneyToCents } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = normalizeCode(b.code);
  if (!code) return Response.json({ error: "Code must be 3–32 letters, numbers, - or _ (no spaces)." }, { status: 400 });
  const kind = b.kind === "fixed" ? "fixed" : "percent";
  let value: number;
  if (kind === "percent") {
    value = Math.round(Number(b.value));
    if (!Number.isInteger(value) || value < 1 || value > 100) return Response.json({ error: "Percent must be between 1 and 100." }, { status: 400 });
  } else {
    const c = parseMoneyToCents(String(b.value ?? ""));
    if (c === null || c < 1) return Response.json({ error: "Enter the amount off, e.g. 5 or 5.00." }, { status: 400 });
    value = c;
  }
  const minRaw = String(b.minSubtotal ?? "").trim();
  const minSubtotal = minRaw ? parseMoneyToCents(minRaw) : 0;
  if (minSubtotal === null) return Response.json({ error: "Minimum subtotal is not a valid amount." }, { status: 400 });
  const maxUsesRaw = String(b.maxUses ?? "").trim();
  const maxUses = maxUsesRaw ? Math.round(Number(maxUsesRaw)) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return Response.json({ error: "Max uses must be a whole number of 1 or more." }, { status: 400 });
  const expiresRaw = String(b.expiresAt ?? "").trim();
  let expiresAt: string | null = null;
  if (expiresRaw) {
    const d = new Date(`${expiresRaw}T23:59:59Z`);
    if (Number.isNaN(d.getTime())) return Response.json({ error: "Expiry date is not valid." }, { status: 400 });
    expiresAt = d.toISOString();
  }
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) || null : null;
  try {
    await query(`INSERT INTO discount_codes (code, kind, value, min_subtotal_cents, max_uses, expires_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [code, kind, value, minSubtotal, maxUses, expiresAt, note]);
  } catch (e) {
    if (String((e as { code?: string }).code) === "23505") return Response.json({ error: "That code already exists." }, { status: 409 });
    throw e;
  }
  return Response.json({ ok: true });
}