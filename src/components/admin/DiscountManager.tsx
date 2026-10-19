"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { describeDiscount } from "@/lib/discounts";
import { fmtDateTime } from "@/lib/format";

interface Code {
  id: number;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  active: boolean;
  note: string | null;
}

const EMPTY = { code: "", kind: "percent", value: "", minSubtotal: "", maxUses: "", expiresAt: "", note: "" };

export default function DiscountManager({ initial }: { initial: Code[] }) {
  const router = useRouter();
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const inp = "ad-input";

  async function create() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error ?? "Could not create the code.");
    setF(EMPTY);
    router.refresh();
  }
  async function toggle(c: Code) {
    await fetch(`/api/admin/discounts/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) });
    router.refresh();
  }
  async function del(c: Code) {
    if (!window.confirm(`Delete code ${c.code}? Past orders keep their discount.`)) return;
    await fetch(`/api/admin/discounts/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <section className="ad-panel" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginTop: 18 }}>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Code<input className={inp} value={f.code} onChange={set("code")} placeholder="SAVE10" /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Type
          <select className={inp} value={f.kind} onChange={set("kind")}><option value="percent">Percent off</option><option value="fixed">Amount off ($)</option></select>
        </label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>{f.kind === "percent" ? "Percent (1–100)" : "Amount off ($)"}<input className={inp} value={f.value} onChange={set("value")} placeholder={f.kind === "percent" ? "10" : "5.00"} /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Minimum subtotal ($, optional)<input className={inp} value={f.minSubtotal} onChange={set("minSubtotal")} /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Max uses (optional)<input className={inp} value={f.maxUses} onChange={set("maxUses")} /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Expires (optional)<input type="date" className={inp} value={f.expiresAt} onChange={set("expiresAt")} /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13, gridColumn: "1 / -1" }}>Note for yourself (optional)<input className={inp} value={f.note} onChange={set("note")} /></label>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
          <button className="ad-btn md" onClick={create} disabled={busy || !f.code.trim() || !f.value.trim()}>{busy ? "Saving…" : "Create code"}</button>
          {err && <span style={{ color: "#b3261e", fontSize: 13 }}>{err}</span>}
        </div>
      </section>

      <section className="ad-box" style={{ overflowX: "auto", marginTop: 18 }}>
        <table className="ad-otable">
          <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id}>
                <td><b>{c.code}</b>{c.note && <div style={{ fontSize: 12, color: "#777" }}>{c.note}</div>}</td>
                <td>{describeDiscount(c.kind, c.value)}{c.minSubtotalCents > 0 && <div style={{ fontSize: 12, color: "#777" }}>min ${(c.minSubtotalCents / 100).toFixed(2)}</div>}</td>
                <td>{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</td>
                <td>{c.expiresAt ? fmtDateTime(c.expiresAt).slice(0, 10) : "—"}</td>
                <td>{c.active ? "Active" : "Disabled"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="ad-btn grey md" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</button>{" "}
                  <button className="ad-btn red md" onClick={() => del(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {!initial.length && <tr><td colSpan={6} style={{ color: "#777" }}>No codes yet. Create one above (for example SAVE10 = 10% off).</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}