"use client";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUSES = ["pending_payment", "paid", "ordered_from_supplier", "shipped", "cancelled", "refunded"];
const money = (c: number, cur: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(c / 100);

export default function OrderEditor({ order }: { order: any }) {
  const [status, setStatus] = useState<string>(order.status);
  const [notes, setNotes] = useState<string>(order.admin_notes ?? "");
  const [tracking, setTracking] = useState<string>(order.tracking_info ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes, trackingInfo: tracking }),
    });
    setMsg(res.ok ? "Saved ✓" : "Error saving");
  }

  const inp = "ad-input";
  return (
    <div className="ad-wrap" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h1 className="ad-h1 plain" style={{ marginBottom: 0 }}>Order #{order.id} <span style={{ fontSize: 14, fontWeight: 400, color: "#777" }}>({order.payment_mode})</span></h1>

      <section className="ad-panel ad-grid2" style={{ fontSize: 14.5, lineHeight: "24px" }}>
        <div>
          <h2 className="ad-pop" style={{ fontWeight: 600, marginBottom: 4 }}>Customer</h2>
          <div>{order.name}</div>
          <div>{order.email}</div>
          {order.phone && <div>{order.phone}</div>}
        </div>
        <div>
          <h2 className="ad-pop" style={{ fontWeight: 600, marginBottom: 4 }}>Ship to</h2>
          <div>{order.ship_line1}</div>
          {order.ship_line2 && <div>{order.ship_line2}</div>}
          <div>{[order.ship_city, order.ship_region, order.ship_postal_code].filter(Boolean).join(", ")}</div>
          <div>{order.ship_country}</div>
        </div>
      </section>

      <section className="ad-box" style={{ overflowX: "auto" }}>
        <table className="ad-otable">
          <thead><tr><th >Item</th><th >Qty</th><th >Price</th><th >Stock now</th><th >Supplier link (private)</th></tr></thead>
          <tbody>
            {order.items.map((i: any) => (
              <tr key={i.id} >
                <td  dir="auto">{i.title}</td>
                <td >{i.quantity}</td>
                <td >{money(i.unit_price_cents * i.quantity, order.currency)}</td>
                <td >{i.availability ?? "—"}</td>
                <td >
                  {i.supplier_url && !String(i.supplier_url).startsWith("mock:") ? (
                    <a style={{ color: "#166a4c", textDecoration: "underline" }} href={i.supplier_url} target="_blank" rel="noreferrer noopener">Open ↗</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
            <tr ><td  colSpan={2}>Shipping</td><td  colSpan={3}>{money(order.shipping_cents, order.currency)}</td></tr>
            <tr ><td  colSpan={2}>Total</td><td  colSpan={3}>{money(order.total_cents, order.currency)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="ad-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Tracking info (shown to the customer)<input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inp} /></label>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>Internal notes<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inp} /></label>
        <div className="flex items-center gap-3">
          <button onClick={save} className="ad-btn md">Save</button>
          {msg && <span style={{ fontSize: 14 }}>{msg}</span>}
        </div>
        <p style={{ fontSize: 12, color: "#777" }}>Stripe payment: {order.stripe_payment_intent ?? "—"} · Paid at: {order.paid_at ?? "—"}</p>
      </section>
    </div>
  );
}
