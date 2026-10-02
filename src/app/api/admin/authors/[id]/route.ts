import { requireAdmin } from "@/lib/auth";
import { deleteAuthor, renameAuthor } from "@/lib/authors";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => ({}))) as { name?: unknown };
  if (!Number.isInteger(id) || typeof b.name !== "string") return Response.json({ error: "bad request" }, { status: 400 });
  try {
    return (await renameAuthor(id, b.name)) ? Response.json({ ok: true }) : Response.json({ error: "not found or empty name" }, { status: 404 });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return Response.json({ error: "An author with that name already exists" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  return (await deleteAuthor(id)) ? Response.json({ ok: true }) : Response.json({ error: "not found" }, { status: 404 });
}
