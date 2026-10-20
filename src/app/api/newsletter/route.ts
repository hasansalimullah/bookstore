import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  hits.set(ip, [...recent, now]);
  const payload = (await req.json().catch(() => ({}))) as { email?: unknown; name?: unknown };
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 80) || null : null;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase().slice(0, 200) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  try {
    await query(`INSERT INTO subscribers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, subscribers.name)`, [email, name]);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
