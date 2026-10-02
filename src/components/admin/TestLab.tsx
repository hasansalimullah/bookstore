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
    <div className="ad-wrap">
      <p className="ad-pop" style={{ fontSize: 17, margin: "30px 0 20px" }}>
        Everything here runs through the real parser and decision logic but makes <b>no network requests</b> and writes nothing to the database.
      </p>
      <div className="ad-soft">
        <div className="ad-testgrid">
          {SCENARIOS.map((s) => (
            <div key={s.key} className="ad-testcard">
              <div className="row">
                <b>{s.title}</b>
                <button className="ad-run" onClick={async () => setRes({ ...res, [s.key]: await run({ scenario: s.key }) })}>Run</button>
              </div>
              <p>{s.note}</p>
              {res[s.key] && (
                <div style={{ marginTop: 12 }}>
                  <div dir="rtl" style={{ textAlign: "left", marginBottom: 8 }}><AvailabilityBadge value={res[s.key].availability} /></div>
                  <DebugPanel d={res[s.key]} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ad-panel" style={{ marginTop: 20 }}>
          <h2 className="ad-pop" style={{ fontSize: 19.5, fontWeight: 600, color: "#1f2937", margin: "0 0 12px" }}>Paste real HTML (e.g. “View source” from a product page)</h2>
          <textarea dir="ltr" rows={8} value={html} onChange={(e) => setHtml(e.target.value)} className="ad-area" style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, height: 170, borderColor: "#d9d9d9", borderRadius: 4 }} />
          <button className="ad-btn md" style={{ marginTop: 16, height: 48, width: 76, padding: 0 }} onClick={async () => setCustom(await run({ html }))}>Parse</button>
          {custom && (
            <div style={{ marginTop: 14 }}>
              <div dir="rtl" style={{ textAlign: "left", marginBottom: 8 }}><AvailabilityBadge value={custom.availability} /></div>
              <DebugPanel d={custom} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
