import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { evaluateFetch } from "@/lib/evaluate";
import { fetchSourcePage } from "@/lib/source-fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// "Test Connection": fetch + parse, returns full debug info. Does NOT write to the database.
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { url?: string; bookId?: number };

  let url = b.url?.trim();
  if (!url && b.bookId) {
    const r = await query("SELECT source_url_private FROM book_sources WHERE book_id = $1", [b.bookId]);
    url = r.rows[0]?.source_url_private;
  }
  if (!url) return Response.json({ error: "url or bookId required" }, { status: 400 });

  const f = await fetchSourcePage(url);
  const ev = evaluateFetch(f);
  return Response.json({
    httpStatus: f.httpStatus,
    selectorFound: ev.parse?.selectorFound ?? false,
    containerFound: ev.parse?.containerFound ?? false,
    containerCount: ev.parse?.containerCount ?? 0,
    detectedText: ev.parse?.detectedText ?? null,
    normalizedText: ev.parse?.normalizedText ?? null,
    parsedStatus: ev.parsedStatus,
    reason: ev.reason,
    jsonLdAvailability: ev.parse?.jsonLdAvailability ?? null,
    errorCode: f.errorCode,
    errorMessage: f.errorMessage,
    durationMs: f.durationMs,
    simulated: f.simulated,
    checkedAt: new Date().toISOString(),
  });
}
