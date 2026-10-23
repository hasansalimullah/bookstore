import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

// PUBLIC. Category tree + author groups for the header menus (no supplier data).
export async function GET() {
  try {
    return Response.json(await getMenuData(), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return Response.json({ error: "temporarily unavailable" }, { status: 503 });
  }
}