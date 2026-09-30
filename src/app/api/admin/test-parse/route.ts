import { requireAdmin } from "@/lib/auth";
import { evaluateFetch } from "@/lib/evaluate";
import { SCENARIO_HTML } from "@/lib/fixtures";
import type { FetchResult } from "@/lib/source-fetcher";

export const dynamic = "force-dynamic";

const base: FetchResult = { ok: false, httpStatus: null, html: null, errorCode: null, errorMessage: null, durationMs: 0, retryAfterSec: null, simulated: true };

// Test page backend: run a canned scenario OR pasted HTML through the parser. No network, no DB.
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { scenario?: string; html?: string };

  let f: FetchResult;
  if (typeof b.html === "string") f = { ...base, ok: true, httpStatus: 200, html: b.html.slice(0, 500_000) };
  else if (b.scenario === "timeout") f = { ...base, errorCode: "timeout", errorMessage: "Simulated timeout" };
  else if (b.scenario === "error") f = { ...base, errorCode: "network", errorMessage: "Simulated network error" };
  else if (b.scenario && b.scenario in SCENARIO_HTML)
    f = { ...base, ok: true, httpStatus: 200, html: SCENARIO_HTML[b.scenario as keyof typeof SCENARIO_HTML] };
  else return Response.json({ error: "unknown scenario" }, { status: 400 });

  const ev = evaluateFetch(f);
  return Response.json({
    httpStatus: f.httpStatus,
    selectorFound: ev.parse?.selectorFound ?? false,
    detectedText: ev.parse?.detectedText ?? null,
    parsedStatus: ev.parsedStatus,
    availability: ev.availability,
    outcome: ev.outcome,
    reason: ev.reason,
    errorMessage: ev.errorMessage,
    checkedAt: new Date().toISOString(),
  });
}
