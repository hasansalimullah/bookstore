import { requireAdmin } from "@/lib/auth";
import { createBook, listAdminBooks } from "@/lib/books";
import { checkBookNow } from "@/lib/checker";
import { extractSourceProductId, validateSourceUrl } from "@/lib/source-fetcher";
import { SLUG_RE, slugify } from "@/lib/slug";
import { parseMoneyToCents } from "@/lib/shop";
import { readExtraImages, readTextFields } from "@/lib/book-fields";
import { getAuthor } from "@/lib/authors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return Response.json({ books: await listAdminBooks() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const b = (await req.json().catch(() => null)) as Record<string, string> | null;
  const extra = readExtraImages(b?.extraImages);
  if (extra === null) return Response.json({ error: "Extra image URLs must start with https://" }, { status: 400 });
  if (!b?.title?.trim()) return Response.json({ error: "العنوان مطلوب (title required)" }, { status: 400 });
  const v = validateSourceUrl(String(b.sourceUrl ?? ""));
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });

  const slug = b.slug?.trim() ? b.slug.trim().toLowerCase() : slugify(b.title);
  if (!SLUG_RE.test(slug)) return Response.json({ error: "slug must be lowercase latin letters, digits and hyphens" }, { status: 400 });

  let authorFields: { authorId?: number | null; author?: string } = {};
  if (b.authorId !== undefined && String(b.authorId) !== "") {
    const a = await getAuthor(Number(b.authorId));
    if (!a) return Response.json({ error: "Author not found" }, { status: 400 });
    authorFields = { authorId: a.id, author: a.name };
  }
  const priceCents = b.price?.toString().trim() ? parseMoneyToCents(b.price) : null;
  if (b.price?.toString().trim() && priceCents === null) return Response.json({ error: "Invalid price (example: 12.50)" }, { status: 400 });

  let id: number;
  try {
    id = await createBook(
      { title: b.title.trim(), ...readTextFields(b), ...authorFields, extraImages: extra ?? [], priceCents, slug },
      v.url.toString(),
      extractSourceProductId(v.url),
    );
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return Response.json({ error: "slug already exists" }, { status: 409 });
    throw e;
  }

  // First check immediately, so the admin sees the ✓ checklist.
  const check = await checkBookNow(id);
  const ev = check?.evaluation;
  return Response.json(
    {
      id,
      checklist: {
        sourcePageFound: !!check?.fetch.httpStatus && check.fetch.httpStatus < 400,
        selectorFound: !!ev?.parse?.selectorFound,
        currentStatus: ev?.parsedStatus ?? "UNKNOWN",
        detectedText: ev?.parse?.detectedText ?? null,
        monitoringEnabled: true,
        simulated: !!check?.fetch.simulated,
        error: ev?.errorMessage ?? null,
      },
    },
    { status: 201 },
  );
}
