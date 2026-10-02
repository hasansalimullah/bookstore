"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function debugLines(d: any): string[] {
  const out: string[] = [
    `HTTP Status: ${d.httpStatus ?? "—"}`,
    `Selector found: ${d.selectorFound ? "Yes" : "No"}`,
    `Detected text: ${d.detectedText ?? "—"}`,
    `Parsed status: ${d.parsedStatus ?? "—"}`,
    `Checked at: ${d.checkedAt ? new Date(d.checkedAt).toISOString().replace("T", " ").slice(0, 16) : "—"}`,
  ];
  if (d.durationMs !== undefined && d.durationMs !== null) out.push(`Duration: ${d.durationMs} ms`);
  if (d.reason) out.push(`Reason: ${d.reason}`);
  if (d.errorMessage) out.push(`Error: ${d.errorMessage}`);
  if (d.containerCount !== undefined && d.containerCount !== null && d.containerCount !== 1) out.push(`Containers matched: ${d.containerCount}`);
  if (d.jsonLdAvailability) out.push(`JSON-LD availability (cross-check): ${d.jsonLdAvailability}`);
  if (d.simulated) out.push("Simulated: yes (no real request was made)");
  return out;
}

export default function DebugPanel({ d, text }: { d?: any; text?: string }) {
  return <div className="ad-debug" dir="ltr">{text ?? debugLines(d ?? {}).join("\n")}</div>;
}
