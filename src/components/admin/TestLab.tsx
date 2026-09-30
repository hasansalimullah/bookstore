"use client";
import { useState } from "react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import DebugPanel from "./DebugPanel";

/* eslint-disable @typescript-eslint/no-explicit-any */
const SCENARIOS = [
  { key: "available", title: "AVAILABLE", note: "HTML contains متوفر → 🟢 Available" },
  { key: "out_of_stock", title: "OUT_OF_STOCK", note: "HTML contains غير متوفر → 🔴 Out of stock" },
  { key: "unknown", title: "UNKNOWN", note: "availability element missing → 🟡 Unknown" },
  { key: "timeout", title: "ERROR (timeout)", note: "simulated timeout → 🟡 Unknown / Error" },
  { key: "error", title: "ERROR (network)", note: "simulated network failure → 🟡 Unknown / Error" },
];

export default function TestLab() {
  const [res, setRes] = useState<Record<string, any>>({});
  const [html, setHtml] = useState('<div class="product-availablity"><strong>متوفر</strong></div>');
  const [custom, setCustom] = useState<any>(null);

  const run = (body: unknown) =>
    fetch("/api/admin/test-parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

  return (
    <div className="space-y-8">
      <p className="text-sm text-stone-600">
        Everything here runs through the real parser and decision logic but makes <b>no network requests</b> and writes nothing to the database.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <div key={s.key} className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <b>{s.title}</b>
              <button className="rounded bg-emerald-700 px-3 py-1 text-sm text-white" onClick={async () => setRes({ ...res, [s.key]: await run({ scenario: s.key }) })}>Run</button>
            </div>
            <p className="text-xs text-stone-500">{s.note}</p>
            {res[s.key] && (
              <>
                <div dir="rtl"><AvailabilityBadge value={res[s.key].availability} /></div>
                <DebugPanel d={res[s.key]} />
              </>
            )}
          </div>
        ))}
      </div>

      <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="font-bold">Paste real HTML (e.g. “View source” from a product page)</h2>
        <textarea dir="ltr" rows={8} value={html} onChange={(e) => setHtml(e.target.value)} className="w-full rounded border border-stone-300 p-2 font-mono text-xs" />
        <button className="rounded bg-emerald-700 px-3 py-1.5 text-white" onClick={async () => setCustom(await run({ html }))}>Parse</button>
        {custom && (
          <>
            <div dir="rtl"><AvailabilityBadge value={custom.availability} /></div>
            <DebugPanel d={custom} />
          </>
        )}
      </section>
    </div>
  );
}
