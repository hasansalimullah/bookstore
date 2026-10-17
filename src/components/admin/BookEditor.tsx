"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DebugPanel, { debugLines } from "./DebugPanel";
import BookFields, { type AuthorOption } from "./BookFields";
import { fmtDateTime } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BookEditor({ initial, authors: initialAuthors }: { initial: any; authors: AuthorOption[] }) {
  const router = useRouter();
  const [b, setB] = useState(initial);
  const [authors, setAuthors] = useState<AuthorOption[]>(initialAuthors);
  const [f, setF] = useState<Record<string, any>>({
    title: initial.title ?? "",
    authorId: initial.authorId ? String(initial.authorId) : "",
    slug: initial.slug ?? "",
    price: initial.priceCents === null || initial.priceCents === undefined ? "" : `$${(initial.priceCents / 100).toFixed(2)}`,
    imageUrl: initial.imageUrl ?? "",
    description: initial.description ?? "",
    titleAr: initial.titleAr ?? "",
    category: initial.category ?? "",
    extraImages: (initial.extraImages ?? []).join("\n"),
    edition: initial.edition ?? "",
    cover: initial.cover ?? "",
    printQuality: initial.printQuality ?? "",
    format: initial.format ?? "",
    harakat: initial.harakat ?? "",
    sourceUrl: initial.sourceUrl ?? "",
    published: initial.published as boolean,
    monitoringEnabled: initial.monitoringEnabled as boolean,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [bb, ll] = await Promise.all([
      fetch(`/api/admin/books/${initial.id}`).then((r) => r.json()),
      fetch(`/api/admin/books/${initial.id}/logs`).then((r) => r.json()),
    ]);
    if (bb.book) setB(bb.book);
    setLogs(ll.logs ?? []);
  }, [initial.id]);
  useEffect(() => {
    reload();
  }, [reload]);

  const post = (url: string, body: unknown = {}) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

  async function save() {
    setBusy("save");
    const payload: any = { ...f };
    if (payload.sourceUrl === initial.sourceUrl) delete payload.sourceUrl; // only send if changed
    const res = await fetch(`/api/admin/books/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Saved ✓" : data.error ?? "Error");
    setBusy(null);
    if (res.ok) {
      reload();
      router.refresh();
    }
  }

  async function del() {
    if (!window.confirm("Delete this book and all its check history?")) return;
    const res = await fetch(`/api/admin/books/${initial.id}`, { method: "DELETE" });
    if (res.ok) router.replace(b.authorId ? `/admin/authors/${b.authorId}` : "/admin");
  }

  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const authorName = authors.find((a) => String(a.id) === String(b.authorId ?? ""))?.name;

  return (
    <div className="ad-wrap wide">
      <p className="ad-crumb">
        {b.authorId ? <Link href={`/admin/authors/${b.authorId}`}>Author</Link> : <Link href="/admin">Author</Link>} / Book / Title
      </p>
      <h1 className="ad-h1 ar" dir="ltr" style={{ marginTop: 22 }}>{b.title}</h1>
      <p className="ad-sub">/books/{b.slug}{authorName ? <span style={{ color: "#999" }}> · {authorName}</span> : null}</p>

      <section className="ad-card white ad-status" style={{ marginTop: 16 }}>
        <div>
          <div>Stored status: <b>{b.storedAvailability}</b> (shown publicly: <b>{b.availability}</b>)</div>
          <div>Last result: {b.lastCheckStatus ?? "—"}{b.lastError ? ` (${b.lastError})` : ""}</div>
          <div>Next scheduled check: {fmtDateTime(b.nextCheckAt, true)}</div>
        </div>
        <div>
          <div>Last checked: {fmtDateTime(b.lastChecked, true)}</div>
          <div>Consecutive failures: {b.consecutiveFailures}</div>
          <div>Source product id: {b.sourceProductId ?? "—"}</div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button className="ad-btn" disabled={!!busy} onClick={async () => {
          setBusy("check");
          const d = await post(`/api/admin/books/${initial.id}/check`);
          const e = d.evaluation ?? {};
          setDebug({ ...(d.fetch ?? {}), selectorFound: e.parse?.selectorFound, detectedText: e.parse?.detectedText, parsedStatus: e.parsedStatus, checkedAt: d.checkedAt, reason: e.reason, errorMessage: e.errorMessage, containerCount: e.parse?.containerCount, jsonLdAvailability: e.parse?.jsonLdAvailability });
          setBusy(null);
          reload();
        }}>{busy === "check" ? "…" : "Check Now"}</button>
        <button className="ad-btn grey" disabled={!!busy} onClick={async () => { setBusy("test"); setDebug(await post("/api/admin/test-connection", { bookId: initial.id })); setBusy(null); }}>
          {busy === "test" ? "…" : "Test Connection"}
        </button>
      </div>
      {debug && <div style={{ marginTop: 16 }}><DebugPanel text={debugLines(debug).join("\n")} /></div>}

      <section className="ad-card" style={{ maxWidth: 1184, marginTop: 44 }}>
        <h2>Edit Book</h2>
        <div className="ad-field" style={{ marginTop: 14 }}>
          <label className="ad-label">Supplier product URL <small>(private — never shown to customers)</small></label>
          <input dir="ltr" className="ad-input" value={f.sourceUrl} onChange={set("sourceUrl")} />
        </div>
        <BookFields f={f} set={set} authors={authors} onAuthorAdded={(a) => setAuthors((x) => [...x, a])} />
        <div className="ad-checks">
          <label><input type="checkbox" checked={f.published} onChange={set("published")} />Published</label>
          <label><input type="checkbox" checked={f.monitoringEnabled} onChange={set("monitoringEnabled")} />Monitoring enabled</label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="ad-btn" style={{ width: 111, height: 34 }} onClick={save} disabled={!!busy}>Save</button>
          <button className="ad-btn red" style={{ height: 34 }} onClick={del}>Delete/Remove</button>
          {msg && <span className="ad-msg">{msg}</span>}
        </div>
      </section>

      <h2 className="ad-h2" style={{ marginTop: 64 }}>Check history ({logs.length})</h2>
      <div className="ad-card white" style={{ overflowX: "auto" }}>
        <table className="ad-table ad-hist" style={{ minWidth: 900 }}>
          <colgroup><col style={{ width: 195 }} /><col style={{ width: 118 }} /><col style={{ width: 130 }} /><col style={{ width: 150 }} /><col style={{ width: 110 }} /><col style={{ width: 130 }} /><col style={{ width: 130 }} /><col /><col style={{ width: 60 }} /></colgroup>
          <thead><tr><th>Time</th><th>Trigger</th><th>Outcome</th><th>Parsed</th><th>HTTP</th><th>Selector</th><th>Text</th><th>Reason / error</th><th>ms</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{fmtDateTime(l.checked_at, true)}</td>
                <td>{l.trigger}</td>
                <td>{l.outcome}</td>
                <td>{l.parsed_status}</td>
                <td>{l.http_status ?? "—"}</td>
                <td>{l.selector_found === null ? "—" : l.selector_found ? "yes" : "no"}</td>
                <td dir="auto" style={{ textAlign: "left" }}>{l.detected_text ?? "—"}</td>
                <td style={{ fontWeight: 400 }}>{l.error_message ?? l.reason ?? ""}</td>
                <td style={{ textAlign: "right" }}>{l.duration_ms ?? ""}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={9} style={{ fontWeight: 400, color: "#777" }}>No checks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
