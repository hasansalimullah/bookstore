"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DebugPanel, { debugLines } from "./DebugPanel";
import { availabilityLabel, fmtDateTime, priceLabel } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AuthorBooks({ books }: { books: any[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ title: string; text: string } | null>(null);

  const post = (url: string, body: unknown = {}) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json().catch(() => ({})));

  const fromCheck = (d: any) => {
    const e = d.evaluation ?? {};
    return { ...(d.fetch ?? {}), selectorFound: e.parse?.selectorFound, detectedText: e.parse?.detectedText, parsedStatus: e.parsedStatus, checkedAt: d.checkedAt, reason: e.reason, errorMessage: e.errorMessage, containerCount: e.parse?.containerCount };
  };

  async function checkOne(b: any) {
    setBusy(`c${b.id}`);
    const d = await post(`/api/admin/books/${b.id}/check`);
    setDebug({ title: `Debug — book #${b.id} (admin only)`, text: debugLines(fromCheck(d)).join("\n") });
    setBusy(null);
    router.refresh();
  }
  async function testOne(b: any) {
    setBusy(`t${b.id}`);
    const d = await post("/api/admin/test-connection", { bookId: b.id });
    setDebug({ title: `Debug — book #${b.id} (admin only)`, text: debugLines(d).join("\n") });
    setBusy(null);
  }
  async function del(b: any) {
    if (!window.confirm("Delete this book and all its check history?")) return;
    const res = await fetch(`/api/admin/books/${b.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }
  async function checkAll() {
    setBusy("all-c");
    const lines: string[] = [];
    for (const b of books) {
      const d = await post(`/api/admin/books/${b.id}/check`);
      const e = d.evaluation ?? {};
      lines.push(`#${b.id}  ${e.parsedStatus ?? "ERROR"}  (HTTP ${d.fetch?.httpStatus ?? "—"})${e.errorMessage ? "  " + e.errorMessage : ""}`);
      setDebug({ title: "Debug — Check All Books Now (admin only)", text: lines.join("\n") });
    }
    setBusy(null);
    router.refresh();
  }
  async function testAll() {
    setBusy("all-t");
    const lines: string[] = [];
    for (const b of books) {
      const d = await post("/api/admin/test-connection", { bookId: b.id });
      lines.push(`#${b.id}  HTTP ${d.httpStatus ?? "—"}  selector ${d.selectorFound ? "yes" : "no"}  ${d.detectedText ?? "—"}  → ${d.parsedStatus ?? "ERROR"}${d.errorMessage ? "  " + d.errorMessage : ""}`);
      setDebug({ title: "Debug — Test All Books Connection (admin only)", text: lines.join("\n") });
    }
    setBusy(null);
  }

  return (
    <>
      <div className="ad-card white">
        <table className="ad-table">
          <colgroup><col style={{ width: 230 }} /><col style={{ width: 105 }} /><col style={{ width: 175 }} /><col style={{ width: 148 }} /><col style={{ width: 142 }} /><col style={{ width: 148 }} /><col /></colgroup>
          <thead>
            <tr><th>Title ({books.length})</th><th>Price</th><th>Availability</th><th>Last checked</th><th>Last result</th><th>Monitoring</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {books.map((b) => {
              const av = availabilityLabel(b.availability);
              const when = fmtDateTime(b.lastChecked).split(" ");
              return (
                <tr key={b.id}>
                  <td className="title">
                    <Link href={`/admin/books/${b.id}`}>{b.title}</Link>
                    <div className="slug">/books/{b.slug}</div>
                  </td>
                  <td>{priceLabel(b.priceCents)}</td>
                  <td className={av.cls === "ok" ? "ok" : av.cls === "bad" ? "bad" : ""}>{av.text}</td>
                  <td>{b.lastChecked ? <>{when[0]}<br />{when[1]} UTC</> : "—"}</td>
                  <td className={b.lastCheckStatus === "ok" ? "ok" : b.lastCheckStatus === "error" ? "bad" : ""} title={b.lastError ?? ""}>
                    {b.lastCheckStatus === "ok" ? "✓ success" : b.lastCheckStatus === "error" ? "✗ failed" : "—"}
                  </td>
                  <td>{b.monitoringEnabled ? "On" : "Off"}</td>
                  <td>
                    <div className="actions">
                      <button className="ad-btn" disabled={!!busy} onClick={() => checkOne(b)}>{busy === `c${b.id}` ? "…" : "Check Now"}</button>
                      <button className="ad-btn grey" disabled={!!busy} onClick={() => testOne(b)}>{busy === `t${b.id}` ? "…" : "Test Connection"}</button>
                      <button className="ad-btn red del" disabled={!!busy} onClick={() => del(b)}>Delete/Remove</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {books.length === 0 && <tr><td colSpan={7} style={{ fontWeight: 400, color: "#777" }}>No books for this author yet.</td></tr>}
          </tbody>
        </table>
        {books.length > 0 && (
          <div className="ad-tablefoot">
            <button className="ad-btn md" disabled={!!busy} onClick={checkAll}>{busy === "all-c" ? "Checking…" : "Check All Books Now"}</button>
            <button className="ad-btn grey md" disabled={!!busy} onClick={testAll}>{busy === "all-t" ? "Testing…" : "Test All Books Connection"}</button>
          </div>
        )}
      </div>
      {debug && (
        <>
          <h2 className="ad-h2">{debug.title}</h2>
          <DebugPanel text={debug.text} />
        </>
      )}
    </>
  );
}
