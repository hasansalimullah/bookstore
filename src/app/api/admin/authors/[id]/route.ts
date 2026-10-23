import { requireAdmin } from "@/lib/auth";
import { deleteAuthor, renameAuthor, updateAuthorMeta } from "@/lib/authors";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const b = (await req.json().catch(() => ({}))) as { name?: unknown; era?: unknown; tags?: unknown; featured?: unknown };
  if (!Number.isInteger(id)) return Response.json({ error: "bad request" }, { status: 400 });

  // Century / school / "top author" details (used by the Authors menu)
  if ("era" in b || "tags" in b || "featured" in b) {
    const era = typeof b.era === "string" && b.era ? b.era : null;
    if (era && !site.authorEras.includes(era)) return Response.json({ error: "Unknown century." }, { status: 400 });
    const allowed = site.authorTags.map((t) => t.key);
    const tags = Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string" && allowed.includes(t)) : [];
    const ok = await updateAuthorMeta(id, { era, tags, featured: b.featured === true });
    return ok ? Response.json({ ok: true }) : Response.json({ error: "not found" }, { status: 404 });
  }

  if (typeof b.name !== "string") return Response.json({ error: "bad request" }, { status: 400 });
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