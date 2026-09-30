"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import DebugPanel from "./DebugPanel";

/* eslint-disable @typescript-eslint/no-explicit-any */
const fmt = (s: string | null) => (s ? new Date(s).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—");

export default function BookEditor({ initial }: { initial: any }) {
  const router = useRouter();
  const [b, setB] = useState(initial);
  const [f, setF] = useState({
    title: initial.title ?? "",
    author: initial.author ?? "",
    slug: initial.slug ?? "",
    imageUrl: initial.imageUrl ?? "",
    description: initial.description ?? "",
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
    const data = await res.json();
    setMsg(res.ok ? "Saved ✓" : data.error);
    setBusy(null);
    if (res.ok) reload();
  }

  async function del() {
    if (!confirm("Delete this book and all its check history?")) return;
    const res = await fetch(`/api/admin/books/${initial.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin");
  }

  const inp = "w-full rounded border border-stone-300 px-2 py-1.5";
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold" dir="auto">{b.title}</h1>
        <div dir="rtl"><AvailabilityBadge value={b.availability} /></div>
      </div>

      <section className="grid gap-2 rounded-lg border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>Stored status: <b>{b.storedAvailability}</b> (shown publicly: <b>{b.availability}</b>)</div>
        <div>Last checked: {fmt(b.lastChecked)}</div>
        <div>Last result: {b.lastCheckStatus ?? "—"} {b.lastError ? `(${b.lastError})` : ""}</div>
        <div>Consecutive failures: {b.consecutiveFailures}</div>
        <div>Next scheduled check: {fmt(b.nextCheckAt)}</div>
        <div>Source product id: {b.sourceProductId ?? "—"}</div>
      </section>

      <div className="flex gap-2">
        <button disabled={!!busy} className="rounded bg-emerald-700 px-3 py-1.5 text-white disabled:opacity-50"
          onClick={async () => { setBusy("check"); const d = await post(`/api/admin/books/${initial.id}/check`); const e = d.evaluation; setDebug({ ...d.fetch, selectorFound: e?.parse?.selectorFound, detectedText: e?.parse?.detectedText, parsedStatus: e?.parsedStatus, checkedAt: d.checkedAt, reason: e?.reason, errorMessage: e?.errorMessage, containerCount: e?.parse?.containerCount, jsonLdAvailability: e?.parse?.jsonLdAvailability }); setBusy(null); reload(); }}>
          {busy === "check" ? "…" : "Check Now"}
        </button>
        <button disabled={!!busy} className="rounded border border-stone-300 px-3 py-1.5 disabled:opacity-50"
          onClick={async () => { setBusy("test"); setDebug(await post("/api/admin/test-connection", { bookId: initial.id })); setBusy(null); }}>
          {busy === "test" ? "…" : "Test Connection"}
        </button>
      </div>
      {debug && <DebugPanel d={debug} />}

      <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="font-bold">Edit</h2>
        <label className="block text-sm">Private source URL<input dir="ltr" className={inp} value={f.sourceUrl} onChange={set("sourceUrl")} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Title<input dir="rtl" className={inp} value={f.title} onChange={set("title")} /></label>
          <label className="text-sm">Author<input dir="rtl" className={inp} value={f.author} onChange={set("author")} /></label>
          <label className="text-sm">Slug<input dir="ltr" className={inp} value={f.slug} onChange={set("slug")} /></label>
          <label className="text-sm">Image URL<input dir="ltr" className={inp} value={f.imageUrl} onChange={set("imageUrl")} /></label>
        </div>
        <label className="block text-sm">Description<textarea dir="rtl" rows={3} className={inp} value={f.description} onChange={set("description")} /></label>
        <div className="flex gap-6 text-sm">
          <label><input type="checkbox" checked={f.published} onChange={set("published")} /> Published</label>
          <label><input type="checkbox" checked={f.monitoringEnabled} onChange={set("monitoringEnabled")} /> Monitoring enabled</label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={!!busy} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Save</button>
          <button onClick={del} className="rounded border border-red-300 px-4 py-2 text-red-700">Delete</button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">Check history ({logs.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-stone-100 text-left">
              <tr><th className="p-2">Time</th><th className="p-2">Trigger</th><th className="p-2">Outcome</th><th className="p-2">Parsed</th><th className="p-2">HTTP</th><th className="p-2">Selector</th><th className="p-2">Text</th><th className="p-2">Reason / error</th><th className="p-2">ms</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-stone-100">
                  <td className="p-2 whitespace-nowrap">{fmt(l.checked_at)}</td>
                  <td className="p-2">{l.trigger}</td>
                  <td className={`p-2 ${l.outcome === "ok" ? "text-emerald-700" : "text-red-700"}`}>{l.outcome}</td>
                  <td className="p-2">{l.parsed_status}</td>
                  <td className="p-2">{l.http_status ?? "—"}</td>
                  <td className="p-2">{l.selector_found === null ? "—" : l.selector_found ? "yes" : "no"}</td>
                  <td className="p-2" dir="rtl">{l.detected_text ?? "—"}</td>
                  <td className="p-2">{l.error_message ?? l.reason ?? ""}</td>
                  <td className="p-2">{l.duration_ms ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
