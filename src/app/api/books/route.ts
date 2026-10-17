import { listBooks } from "@/lib/books";

export const dynamic = "force-dynamic";

// PUBLIC. Returns PublicBook[] only (no source URL field exists on that type).
// ?q=word   ?category=word|word   ?sort=new   ?limit=1..200
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 200, 1), 200);
  try {
    const books = await listBooks({
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
      sort: sp.get("sort") === "new" ? "new" : undefined,
      limit,
    });
    return Response.json({ books }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 });
  }
}