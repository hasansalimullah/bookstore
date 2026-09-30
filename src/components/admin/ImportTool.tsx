"use client";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ImportTool() {
  const [csv, setCsv] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [done, setDone] = useState<any>(null);

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    setDone(null);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, sheetUrl, dryRun }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      if (data.rows) setPreview(data);
      return;
    }
    if (dryRun) setPreview(data);
    else {
      setDone(data);
      setPreview(null);
    }
  }

  async function onFile(e: any) {
    const f = e.target.files?.[0];
    if (f) {
      setCsv(await f.text());
      setSheetUrl("");
      setPreview(null);
    }
  }

  const inp = "w-full rounded border border-stone-300 px-2 py-1.5";
  const importable = preview ? preview.counts.create + preview.counts.update : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Import books from a Google Sheet</h1>

      <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 text-sm">
        <p className="font-medium">Your sheet needs these column headers in row 1 (any order; only the first two are required):</p>
        <p className="rounded bg-stone-50 p-2 font-mono text-xs">Supplier product URL | Title | Author | Slug | Price | Image URL | Description</p>
        <ul className="list-disc space-y-1 pl-5 text-stone-700">
          <li>Empty Slug = made automatically from the title. Empty Price = book can&apos;t be ordered until you add one.</li>
          <li>Importing the same sheet again is safe: rows with a supplier URL that already exists <b>update</b> that book (its page URL never changes).</li>
          <li>Empty cells on an update keep the existing value. Up to 500 rows at a time.</li>
          <li>New books get their availability checked automatically within a few minutes.</li>
        </ul>
        <a href="/api/admin/import/template" className="text-emerald-800 underline">Download a template CSV</a>
      </section>

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
        <div>
          <h2 className="mb-1 font-bold">Option 1 (recommended, most private): copy or upload</h2>
          <p className="mb-2 text-xs text-stone-600">In Google Sheets select all cells (Ctrl+A), copy (Ctrl+C) and paste below — or File → Download → CSV and choose the file.</p>
          <textarea dir="auto" rows={8} value={csv} onChange={(e) => { setCsv(e.target.value); setPreview(null); }} className={`${inp} font-mono text-xs`} placeholder="Paste here…" />
          <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="mt-2 text-sm" />
        </div>
        <div>
          <h2 className="mb-1 font-bold">Option 2: Google Sheets link</h2>
          <p className="mb-2 text-xs text-amber-800">
            The sheet must be shared as &quot;Anyone with the link → Viewer&quot;. Your sheet contains private supplier links, so turn sharing back off right after importing — or use option 1.
          </p>
          <input dir="ltr" value={sheetUrl} onChange={(e) => { setSheetUrl(e.target.value); setPreview(null); }} className={inp} placeholder="https://docs.google.com/spreadsheets/d/…/edit" />
        </div>
        <button onClick={() => run(true)} disabled={busy || (!csv.trim() && !sheetUrl.trim())} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">
          {busy ? "Working…" : "Preview import"}
        </button>
      </section>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {done && (
        <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">
          ✓ Imported: {done.created} new, {done.updated} updated. Availability will fill in automatically within a few minutes.{" "}
          <a href="/admin" className="underline">Go to books</a>
        </p>
      )}

      {preview && (
        <section className="space-y-3">
          <p className="text-sm">
            <b className="text-emerald-800">{preview.counts.create} new</b> · <b className="text-blue-800">{preview.counts.update} updates</b> · <b className="text-red-700">{preview.counts.error} errors</b>
            {preview.counts.error > 0 && " (rows with errors are skipped)"}
          </p>
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-stone-100 text-left"><tr><th className="p-2">Row</th><th className="p-2">Action</th><th className="p-2">Title</th><th className="p-2">Slug</th><th className="p-2">Notes</th></tr></thead>
              <tbody>
                {preview.rows.map((r: any) => (
                  <tr key={r.row} className="border-t border-stone-100 align-top">
                    <td className="p-2">{r.row}</td>
                    <td className={`p-2 font-medium ${r.action === "create" ? "text-emerald-800" : r.action === "update" ? "text-blue-800" : "text-red-700"}`}>{r.action}</td>
                    <td className="p-2" dir="auto">{r.title}</td>
                    <td className="p-2">{r.slug ?? "—"}</td>
                    <td className="p-2">{r.error ? <span className="text-red-700">{r.error}</span> : r.warnings.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => run(false)} disabled={busy || importable === 0} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">
            {busy ? "Importing…" : `Import ${importable} book${importable === 1 ? "" : "s"}`}
          </button>
        </section>
      )}
    </div>
  );
}
