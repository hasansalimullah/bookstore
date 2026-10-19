import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => ({}))) as { active?: unknown };
  if (!Number.isInteger(id) || typeof b.active !== "boolean") return Response.json({ error: "bad request" }, { status: 400 });
  await query(`UPDATE discount_codes SET active = $2 WHERE id = $1`, [id, b.active]);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  await query(`DELETE FROM discount_codes WHERE id = $1`, [id]);
  return Response.json({ ok: true });
}