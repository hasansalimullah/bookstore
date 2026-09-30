import { getPublicBook } from "@/lib/books";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const book = await getPublicBook(slug);
    if (!book) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(book, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 });
  }
}
