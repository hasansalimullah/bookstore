import { validateContact } from "@/lib/contact";
import { notifyContact } from "@/lib/contact-mail";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>(); // 5 messages / 10 min per IP

export async function POST(req: Request) {
  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) return Response.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") return Response.json({ ok: true });

  const v = validateContact(body);
  if (!v.ok) return Response.json({ error: "Please check the highlighted fields.", fields: v.errors }, { status: 400 });

  hits.set(ip, [...recent, now]);
  try {
    await query(`INSERT INTO contact_messages (name, email, subject, order_ref, message) VALUES ($1,$2,$3,$4,$5)`, [v.value.name, v.value.email, v.value.subject, v.value.orderRef, v.value.message]);
  } catch {
    return Response.json({ error: "Could not send your message right now. Please email us directly." }, { status: 500 });
  }
  await notifyContact(v.value);
  return Response.json({ ok: true });
}