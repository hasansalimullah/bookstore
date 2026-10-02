"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BookFields, { BOOK_FIELD_DEFAULTS, type AuthorOption } from "./BookFields";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AddBookCard({ authors: initialAuthors }: { authors: AuthorOption[] }) {
  const router = useRouter();
  const empty = { ...BOOK_FIELD_DEFAULTS, sourceUrl: "" };
  const [f, setF] = useState<Record<string, any>>(empty);
  const [authors, setAuthors] = useState<AuthorOption[]>(initialAuthors);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "error");
    setResult(data.checklist);
    setF(empty);
    router.refresh();
  }

  return (
    <>
      <section className="ad-card">
        <h2>Add Book</h2>
        <div className="ad-field" style={{ marginTop: 14 }}>
          <label className="ad-label">Supplier product URL <small>(private — never shown to customers)</small></label>
          <input dir="ltr" className="ad-input" value={f.sourceUrl} onChange={set("sourceUrl")} placeholder="Paste the supplier product link (or mock://available for testing)" />
        </div>
        <BookFields f={f} set={set} authors={authors} onAuthorAdded={(a) => { setAuthors((x) => [...x, a].sort((p, q) => p.name.localeCompare(q.name))); router.refresh(); }} />
      </section>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
        <button className="ad-btn big" onClick={submit} disabled={busy || !f.title || !f.sourceUrl}>{busy ? "Checking…" : "Import/Add Book"}</button>
        {error && <span style={{ color: "#b3261e", fontSize: 14 }}>{error}</span>}
      </div>
      {result && (
        <ul className="ad-panel" style={{ marginTop: 14, listStyle: "none", fontSize: 14, lineHeight: "26px" }}>
          <li>{result.sourcePageFound ? "✓" : "✗"} Source page found{result.simulated ? " (simulated)" : ""}</li>
          <li>{result.selectorFound ? "✓" : "✗"} Availability selector found</li>
          <li>{result.currentStatus !== "UNKNOWN" ? "✓" : "✗"} Current status: <span dir="auto">{result.detectedText ?? result.currentStatus}</span> ({result.currentStatus})</li>
          <li>✓ Monitoring enabled</li>
          {result.error && <li style={{ color: "#b3261e" }}>Note: {result.error}</li>}
        </ul>
      )}
    </>
  );
}
