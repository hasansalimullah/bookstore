import { requireAdmin } from "@/lib/auth";
import { deleteBook, getAdminBook, updateBook } from "@/lib/books";
import { extractSourceProductId, validateSourceUrl } from "@/lib/source-fetcher";
import { SLUG_RE } from "@/lib/slug";
import { parseMoneyToCents } from "@/lib/shop";
import { readExtraImages, readTextFields } from "@/lib/book-fields";
import { getAuthor } from "@/lib/authors";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

async function parseId(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = await parseId(ctx);
  const book = id ? await getAdminBook(id) : null;
  return book ? Response.json({ book }) : Response.json({ error: "not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = await parseId(ctx);
  if (!id) return Response.json({ error: "bad id" }, { status: 400 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Parameters<typeof updateBook>[1] = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim();
  Object.assign(patch, readTextFields(b));
  if (b.authorId !== undefined) {
    if (b.authorId === null || String(b.authorId) === "") {
      patch.authorId = null;
    } else {
      const a = await getAuthor(Number(b.authorId));
      if (!a) return Response.json({ error: "Author not found" }, { status: 400 });
      patch.authorId = a.id;
      patch.author = a.name;
    }
  }
  const extra = readExtraImages(b.extraImages);
  if (extra === null) return Response.json({ error: "Extra image URLs must start with https://" }, { status: 400 });
  if (extra !== undefined) patch.extraImages = extra;
  if (typeof b.price === "string" && b.price.trim()) {
    const c = parseMoneyToCents(b.price);
    if (c === null) return Response.json({ error: "Invalid price (example: 12.50)" }, { status: 400 });
    patch.priceCents = c;
  }
  if (typeof b.published === "boolean") patch.published = b.published;
  if (typeof b.monitoringEnabled === "boolean") patch.monitoringEnabled = b.monitoringEnabled;
  if (typeof b.slug === "string" && b.slug.trim()) {
    if (!SLUG_RE.test(b.slug.trim())) return Response.json({ error: "invalid slug" }, { status: 400 });
    patch.slug = b.slug.trim();
  }
  if (typeof b.sourceUrl === "string" && b.sourceUrl.trim()) {
    const v = validateSourceUrl(b.sourceUrl);
    if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
    patch.sourceUrl = v.url.toString();
    patch.sourceProductId = extractSourceProductId(v.url);
  }
  try {
    await updateBook(id, patch);
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return Response.json({ error: "slug already exists" }, { status: 409 });
    throw e;
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = await parseId(ctx);
  if (!id) return Response.json({ error: "bad id" }, { status: 400 });
  return (await deleteBook(id)) ? Response.json({ ok: true }) : Response.json({ error: "not found" }, { status: 404 });
}
