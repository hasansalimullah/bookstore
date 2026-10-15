import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => ({}))) as { read?: unknown };
  if (!Number.isInteger(id) || typeof b.read !== "boolean") return Response.json({ error: "bad request" }, { status: 400 });
  await query(`UPDATE contact_messages SET is_read = $2 WHERE id = $1`, [id, b.read]);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  await query(`DELETE FROM contact_messages WHERE id = $1`, [id]);
  return Response.json({ ok: true });
}