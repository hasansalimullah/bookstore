"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/format";

interface Saved {
  id: string;
  at: number;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const I = {
  orders: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></svg>,
  heart: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.800-8 11-8 11z" /></svg>,
  cart: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.500 12h11L21 7H6" /></svg>,
  track: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>,
  tag: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="8" cy="9" r="1.2" /></svg>,
  mail: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  chat: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><path d="M4 5h16v11H9l-5 4V5z" /></svg>,
  shield: <svg width="34" height="34" viewBox="0 0 24 24" {...stroke}><path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6l8-3z" /></svg>,
};

export default function AccountHub() {
  const router = useRouter();
  const [orders, setOrders] = useState<Saved[]>([]);
  const [find, setFind] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("orders-v1") ?? "[]");
      if (Array.isArray(v)) setOrders(v.filter((o) => typeof o?.id === "string"));
    } catch {
      /* ignore */
    }
  }, []);

  function open(e: React.FormEvent) {
    e.preventDefault();
    // Accept a full order link or just the code at the end of it.
    const id = find.trim().split(/[/?#]/).filter(Boolean).pop() ?? "";
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return setMsg("That doesn't look like an order link or code.");
    router.push(`/order/${id}`);
  }

  const tile = (href: string, icon: React.ReactNode, label: string) => (
    <Link href={href} className="t">
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="sf-account">
      <div className="sf-tiles">
        {tile("#orders", I.orders, "Your orders")}
        {tile("/wishlist", I.heart, "My wishlist")}
        {tile("/cart", I.cart, "My cart")}
        {tile("#track", I.track, "Track an order")}
        {tile("/cart", I.tag, "Discount codes")}
        {tile("/#newsletter", I.mail, "Newsletter")}
        {tile("/contact", I.chat, "Contact us")}
        <button type="button" className="t" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}>
          {I.shield}
          <span>Cookie settings</span>
        </button>
      </div>

      <section id="orders" className="sf-acbox">
        <h2>Your orders</h2>
        {orders.length === 0 ? (
          <p className="muted">Orders you place on this device appear here. (No sign-in needed — your order links are saved in this browser.)</p>
        ) : (
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                <span>{fmtDateTime(new Date(o.at).toISOString())}</span>
                <Link href={`/order/${o.id}`}>View order</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="track" className="sf-acbox">
        <h2>Track an order</h2>
        <p className="muted">Paste the order link (or code) from your confirmation page.</p>
        <form onSubmit={open}>
          <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="https://…/order/…" aria-label="Order link or code" />
          <button>Open</button>
        </form>
        {msg && <p className="err">{msg}</p>}
      </section>
    </div>
  );
}