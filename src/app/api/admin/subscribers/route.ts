import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { rows } = await query(`SELECT email, created_at FROM subscribers ORDER BY created_at DESC`);
  const csv = "email,subscribed_at\n" + rows.map((r) => `${r.email},${new Date(r.created_at).toISOString()}`).join("\n") + "\n";
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"' } });
}
