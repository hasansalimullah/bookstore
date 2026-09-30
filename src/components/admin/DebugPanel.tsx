"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DebugPanel({ d }: { d: any }) {
  const rows: [string, string][] = [
    ["HTTP Status", d.httpStatus ?? "—"],
    ["Selector found", d.selectorFound ? "Yes" : "No"],
    ["Detected text", d.detectedText ?? "—"],
    ["Parsed status", d.parsedStatus],
    ["Checked at", d.checkedAt ? new Date(d.checkedAt).toISOString().replace("T", " ").slice(0, 16) : "—"],
  ].map(([k, v]) => [k as string, String(v)]);
  const extra: [string, string][] = [];
  if (d.reason) extra.push(["Reason", String(d.reason)]);
  if (d.errorMessage) extra.push(["Error", String(d.errorMessage)]);
  if (d.containerCount !== undefined) extra.push(["Containers matched", String(d.containerCount)]);
  if (d.jsonLdAvailability) extra.push(["JSON-LD availability (cross-check)", String(d.jsonLdAvailability)]);
  if (d.durationMs !== undefined) extra.push(["Duration", `${d.durationMs} ms`]);
  if (d.simulated) extra.push(["Simulated", "yes (no real request was made)"]);

  return (
    <pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs leading-6 text-emerald-200" dir="ltr">
      {[...rows, ...extra].map(([k, v]) => `${k}: ${v}`).join("\n")}
    </pre>
  );
}
