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

  const inp = "w-full rounded border border-stone-300 px-2 py-1.5";
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Order #{order.id} <span className="text-sm font-normal text-stone-500">({order.payment_mode})</span></h1>

      <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-1 font-bold">Customer</h2>
          <div>{order.name}</div>
          <div>{order.email}</div>
          {order.phone && <div>{order.phone}</div>}
        </div>
        <div>
          <h2 className="mb-1 font-bold">Ship to</h2>
          <div>{order.ship_line1}</div>
          {order.ship_line2 && <div>{order.ship_line2}</div>}
          <div>{[order.ship_city, order.ship_region, order.ship_postal_code].filter(Boolean).join(", ")}</div>
          <div>{order.ship_country}</div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left"><tr><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Price</th><th className="p-2">Stock now</th><th className="p-2">Supplier link (private)</th></tr></thead>
          <tbody>
            {order.items.map((i: any) => (
              <tr key={i.id} className="border-t border-stone-100">
                <td className="p-2" dir="auto">{i.title}</td>
                <td className="p-2">{i.quantity}</td>
                <td className="p-2">{money(i.unit_price_cents * i.quantity, order.currency)}</td>
                <td className="p-2">{i.availability ?? "—"}</td>
                <td className="p-2">
                  {i.supplier_url && !String(i.supplier_url).startsWith("mock:") ? (
                    <a className="text-emerald-800 underline" href={i.supplier_url} target="_blank" rel="noreferrer noopener">Open ↗</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
            <tr className="border-t"><td className="p-2" colSpan={2}>Shipping</td><td className="p-2" colSpan={3}>{money(order.shipping_cents, order.currency)}</td></tr>
            <tr className="border-t font-bold"><td className="p-2" colSpan={2}>Total</td><td className="p-2" colSpan={3}>{money(order.total_cents, order.currency)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
        <label className="block text-sm">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-sm">Tracking info (shown to the customer)<input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inp} /></label>
        <label className="block text-sm">Internal notes<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inp} /></label>
        <div className="flex items-center gap-3">
          <button onClick={save} className="rounded bg-emerald-700 px-4 py-2 text-white">Save</button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
        <p className="text-xs text-stone-500">Stripe payment: {order.stripe_payment_intent ?? "—"} · Paid at: {order.paid_at ?? "—"}</p>
      </section>
    </div>
  );
}
