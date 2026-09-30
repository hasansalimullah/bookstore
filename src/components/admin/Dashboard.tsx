"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import DebugPanel from "./DebugPanel";

/* eslint-disable @typescript-eslint/no-explicit-any */
const fmt = (s: string | null) => (s ? new Date(s).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—");

export default function Dashboard() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ id: number; data: any } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/books");
    if (res.status === 401) return (window.location.href = "/admin/login");
    setBooks(((await res.json()) as any).books ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(kind: "check" | "test", b: any) {
    setBusy(`${kind}-${b.id}`);
    const res = await fetch(kind === "check" ? `/api/admin/books/${b.id}/check` : "/api/admin/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: kind === "test" ? JSON.stringify({ bookId: b.id }) : "{}",
    });
    const data = await res.json();
    setBusy(null);
    if (kind === "test") setDebug({ id: b.id, data });
    else {
      const e = data.evaluation;
      setDebug({ id: b.id, data: { ...data.fetch, selectorFound: e?.parse?.selectorFound, detectedText: e?.parse?.detectedText, parsedStatus: e?.parsedStatus, checkedAt: data.checkedAt, reason: e?.reason, errorMessage: e?.errorMessage } });
      load();
    }
  }

  return (
    <div className="space-y-8">
      <AddBookForm onAdded={load} />
      <section>
        <h2 className="mb-3 text-lg font-bold">Books ({books.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Availability</th>
                  <th className="p-2">Last checked</th>
                  <th className="p-2">Last result</th>
                  <th className="p-2">Monitoring</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-t border-stone-100 align-top">
                    <td className="p-2">
                      <Link href={`/admin/books/${b.id}`} className="font-medium text-emerald-800 underline" dir="auto">{b.title}</Link>
                      <div className="text-xs text-stone-500">/books/{b.slug}</div>
                    </td>
                    <td className="p-2" dir="rtl"><AvailabilityBadge value={b.availability} /></td>
                    <td className="p-2">{fmt(b.lastChecked)}</td>
                    <td className="p-2">
                      {b.lastCheckStatus === "ok" && <span className="text-emerald-700">✓ success</span>}
                      {b.lastCheckStatus === "error" && <span className="text-red-700" title={b.lastError ?? ""}>✗ {b.lastError ?? "failed"}</span>}
                      {!b.lastCheckStatus && "—"}
                    </td>
                    <td className="p-2">{b.monitoringEnabled ? "on" : "off"}</td>
                    <td className="space-x-2 whitespace-nowrap p-2">
                      <button disabled={!!busy} onClick={() => act("check", b)} className="rounded bg-emerald-700 px-2 py-1 text-white disabled:opacity-50">
                        {busy === `check-${b.id}` ? "…" : "Check Now"}
                      </button>
                      <button disabled={!!busy} onClick={() => act("test", b)} className="rounded border border-stone-300 px-2 py-1 disabled:opacity-50">
                        {busy === `test-${b.id}` ? "…" : "Test Connection"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {debug && (
        <section>
          <h3 className="mb-2 font-bold">Debug — book #{debug.id} (admin only)</h3>
          <DebugPanel d={debug.data} />
        </section>
      )}
    </div>
  );
}

function AddBookForm({ onAdded }: { onAdded: () => void }) {
  const empty = { title: "", author: "", slug: "", description: "", imageUrl: "", sourceUrl: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "error");
    setResult(data.checklist);
    setF(empty);
    onAdded();
  }

  const inp = "w-full rounded border border-stone-300 px-2 py-1.5";
  return (
    <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-bold">Add Book</h2>
      <label className="block text-sm font-medium">
        ibnaljawzi Product URL <span className="font-normal text-stone-500">(private — never shown to customers)</span>
        <input dir="ltr" className={inp} placeholder="https://ibnaljawzi.com/xxxxxxxx  (or mock://available in mock mode)" value={f.sourceUrl} onChange={set("sourceUrl")} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Title (Arabic)<input dir="rtl" className={inp} value={f.title} onChange={set("title")} /></label>
        <label className="text-sm">Author<input dir="rtl" className={inp} value={f.author} onChange={set("author")} /></label>
        <label className="text-sm">Slug (optional, auto-made from the title)<input dir="ltr" className={inp} value={f.slug} onChange={set("slug")} /></label>
        <label className="text-sm">Image URL (your own image)<input dir="ltr" className={inp} value={f.imageUrl} onChange={set("imageUrl")} /></label>
      </div>
      <label className="block text-sm">Description<textarea dir="rtl" rows={3} className={inp} value={f.description} onChange={set("description")} /></label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button onClick={submit} disabled={busy || !f.title || !f.sourceUrl} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">
        {busy ? "Checking source…" : "Import / Add Book"}
      </button>
      {result && (
        <ul className="space-y-1 rounded bg-stone-50 p-3 text-sm">
          <li>{result.sourcePageFound ? "✓" : "✗"} Source page found{result.simulated ? " (simulated)" : ""}</li>
          <li>{result.selectorFound ? "✓" : "✗"} Availability selector found</li>
          <li>{result.currentStatus !== "UNKNOWN" ? "✓" : "✗"} Current status: <span dir="rtl">{result.detectedText ?? result.currentStatus}</span> ({result.currentStatus})</li>
          <li>✓ Monitoring enabled</li>
          {result.error && <li className="text-red-700">Note: {result.error}</li>}
        </ul>
      )}
    </section>
  );
}
