import { requireAdmin } from "@/lib/auth";
import { applyImport, loadExisting } from "@/lib/import-db";
import { MAX_ROWS, parseRecords, planImport, summarize } from "@/lib/import-plan";
import { isGoogleHost, toSheetCsvUrl } from "@/lib/sheets";
import { parseMoneyToCents } from "@/lib/shop";
import { extractSourceProductId, validateSourceUrl } from "@/lib/source-fetcher";
import { SLUG_RE, slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 2_000_000;

async function fetchSheet(link: string): Promise<{ text: string } | { error: string }> {
  const csvUrl = toSheetCsvUrl(link);
  if (!csvUrl) return { error: "That doesn't look like a Google Sheets link (docs.google.com/spreadsheets/...)." };
  try {
    const res = await fetch(csvUrl, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { Accept: "text/csv,text/plain" } });
    if (!isGoogleHost(new URL(res.url || csvUrl).hostname)) return { error: "Unexpected redirect." };
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || /html/i.test(ct)) {
      return { error: "Couldn't read the sheet. In Google Sheets: Share → General access → \"Anyone with the link\" (Viewer), or download the sheet as CSV and upload/paste it here instead." };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return { error: "Sheet is too large." };
    return { text: new TextDecoder("utf-8").decode(buf) };
  } catch {
    return { error: "Couldn't reach Google Sheets. Try again, or paste the CSV instead." };
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const b = (await req.json().catch(() => ({}))) as { csv?: string; sheetUrl?: string; dryRun?: boolean };
  let text = typeof b.csv === "string" ? b.csv : "";
  if (!text.trim() && typeof b.sheetUrl === "string" && b.sheetUrl.trim()) {
    const r = await fetchSheet(b.sheetUrl);
    if ("error" in r) return Response.json({ error: r.error }, { status: 400 });
    text = r.text;
  }
  if (!text.trim()) return Response.json({ error: "Paste your sheet data, upload a CSV, or enter a Google Sheets link." }, { status: 400 });
  if (text.length > MAX_BYTES) return Response.json({ error: "Data is too large." }, { status: 400 });

  const parsed = parseRecords(text);
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });
  if (parsed.records.length === 0) return Response.json({ error: "No book rows found under the header row." }, { status: 400 });
  if (parsed.records.length > MAX_ROWS) return Response.json({ error: `Too many rows (${parsed.records.length}). Max ${MAX_ROWS} per import — split the sheet.` }, { status: 400 });

  try {
    const plan = planImport(parsed.records, await loadExisting(), {
      validateUrl: validateSourceUrl,
      slugify,
      slugRe: SLUG_RE,
      parsePrice: parseMoneyToCents,
      productId: extractSourceProductId,
    });
    const counts = summarize(plan);

    // Never send private fields (supplier URLs etc.) back — the preview only needs these.
    const rows = plan.map((p) => ({ row: p.row, action: p.action, title: p.title, slug: p.slug, error: p.error, warnings: p.warnings }));

    if (b.dryRun !== false) return Response.json({ dryRun: true, counts, rows });
    if (counts.create + counts.update === 0) return Response.json({ error: "Nothing to import — fix the errors first.", counts, rows }, { status: 400 });

    const done = await applyImport(plan);
    return Response.json({ dryRun: false, counts, rows, ...done });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return Response.json({ error: "A slug was taken while importing. Run the preview again." }, { status: 409 });
    console.error("[import] failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Import failed. Nothing was changed." }, { status: 500 });
  }
}
