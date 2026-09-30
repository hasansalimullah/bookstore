import { listPublicBooks } from "@/lib/books";

export const dynamic = "force-dynamic";

// PUBLIC. Returns PublicBook[] only — that type has no source URL field.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  try {
    const books = await listPublicBooks(q);
    return Response.json({ books }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 }); // generic: no internals
  }
}
