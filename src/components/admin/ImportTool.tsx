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
    const res = await fetch("/api/admin/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv, sheetUrl, dryRun }) });
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

  const importable = preview ? preview.counts.create + preview.counts.update : 0;

  return (
    <div className="ad-wrap">
      <h1 className="ad-h1 plain" style={{ marginTop: 34 }}>Import books from a Google Sheet</h1>

      <section className="ad-panel" style={{ marginTop: 22, fontSize: 14.5, lineHeight: "26px", boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
        <p>Your sheet needs these column headers in row 1 (any order; only the supplier URL and a title are required):</p>
        <p style={{ background: "#f8f8f6", padding: "6px 10px", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, margin: "6px 0 8px", overflowX: "auto" }}>
          Supplier product URL | Title | Title (Arabic) | Author | Slug | Price | Category | Image URL | Image URL 2 | Image URL 3 | Description | Edition | Cover | Print Quality | Format | Harakat
        </p>
        <ul style={{ paddingLeft: 22, listStyle: "disc" }}>
          <li>Empty Slug = made automatically from the title. Empty Price = book can&apos;t be ordered until you add one.</li>
          <li>Importing the same sheet again is safe: rows with a supplier URL that already exists <b>update</b> that book (its page URL never changes).</li>
          <li>Empty cells on an update keep the existing value. Up to 500 rows at a time.</li>
          <li>New books get their availability checked automatically within a few minutes. Authors are added to the Authors list automatically.</li>
        </ul>
        <a href="/api/admin/import/template" style={{ color: "#166a4c", textDecoration: "underline" }}>Download a template CSV</a>
      </section>

      <section className="ad-panel" style={{ marginTop: 22, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
        <h2 className="ad-pop" style={{ fontSize: 18.5, fontWeight: 600, margin: 0, color: "#1f2937" }}>Option 1 (recommended, most private): copy or upload</h2>
        <p style={{ fontSize: 13.5, color: "#666", margin: "4px 0 10px" }}>In Google Sheets select all cells (Ctrl+A), copy (Ctrl+C) and paste below — or File → Download → CSV and choose the file.</p>
        <textarea dir="auto" className="ad-area" style={{ height: 170, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, borderColor: "#d9d9d9" }} value={csv} onChange={(e) => { setCsv(e.target.value); setPreview(null); }} placeholder="Paste here…" />
        <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ marginTop: 14, fontSize: 14 }} />

        <h2 className="ad-pop" style={{ fontSize: 18.5, fontWeight: 600, margin: "26px 0 0", color: "#1f2937" }}>Option 2: Google Sheets link</h2>
        <p style={{ fontSize: 13.5, color: "#b4400a", margin: "4px 0 8px" }}>The sheet must be shared as &quot;Anyone with the link → Viewer&quot;. Your sheet contains private supplier links, so turn sharing back off right after importing — or use option 1.</p>
        <input dir="ltr" className="ad-input" style={{ borderColor: "#d9d9d9", borderRadius: 6, height: 44 }} value={sheetUrl} onChange={(e) => { setSheetUrl(e.target.value); setPreview(null); }} placeholder="https://docs.google.com/spreadsheets/d/…/edit" />
        <button className="ad-btn md" style={{ marginTop: 18, height: 44, fontSize: 15 }} onClick={() => run(true)} disabled={busy || (!csv.trim() && !sheetUrl.trim())}>
          {busy ? "Working…" : "Preview Import"}
        </button>
      </section>

      {error && <p className="ad-banner err" style={{ width: "auto", margin: "16px 0 0" }}>{error}</p>}
      {done && (
        <p className="ad-banner info" style={{ width: "auto", margin: "16px 0 0", background: "#eaf5ea", borderColor: "#9fcf9f", color: "#1b4d1b" }}>
          ✓ Imported: {done.created} new, {done.updated} updated. Availability will fill in automatically within a few minutes. <a href="/admin" style={{ textDecoration: "underline" }}>Go to books</a>
        </p>
      )}
      {preview && (
        <section style={{ marginTop: 22 }}>
          <p style={{ fontSize: 14.5 }}>
            <b style={{ color: "#166a4c" }}>{preview.counts.create} new</b> · <b style={{ color: "#1d4ed8" }}>{preview.counts.update} updates</b> · <b style={{ color: "#b3261e" }}>{preview.counts.error} errors</b>
            {preview.counts.error > 0 && " (rows with errors are skipped)"}
          </p>
          <div className="ad-box" style={{ marginTop: 8, overflowX: "auto" }}>
            <table className="ad-otable" style={{ fontSize: 13.5 }}>
              <thead><tr><th>Row</th><th>Action</th><th>Title</th><th>Slug</th><th>Notes</th></tr></thead>
              <tbody>
                {preview.rows.map((r: any) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td style={{ fontWeight: 600, color: r.action === "create" ? "#166a4c" : r.action === "update" ? "#1d4ed8" : "#b3261e" }}>{r.action}</td>
                    <td dir="auto">{r.title}</td>
                    <td>{r.slug ?? "—"}</td>
                    <td>{r.error ? <span style={{ color: "#b3261e" }}>{r.error}</span> : r.warnings.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="ad-btn md" style={{ marginTop: 16, height: 44, fontSize: 15 }} onClick={() => run(false)} disabled={busy || importable === 0}>
            {busy ? "Importing…" : `Import ${importable} book${importable === 1 ? "" : "s"}`}
          </button>
        </section>
      )}
    </div>
  );
}
