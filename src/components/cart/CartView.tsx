"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/shop";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CartView() {
  const { items, ready, setQty, remove } = useCart();
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!items.length) return setQuote({ lines: [], totals: { subtotalCents: 0, shippingCents: 0, totalCents: 0 }, currency: "usd" });
    let cancelled = false;
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) })
      .then((r) => r.json())
      .then((d) => !cancelled && (d.error ? setError(true) : setQuote(d)))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  if (!ready || (!quote && !error)) return <p className="text-stone-500">Loading cart…</p>;
  if (error) return <p className="text-amber-800">Could not load your cart. Please refresh.</p>;
  if (!quote.lines.length)
    return (
      <div className="py-10 text-center">
        <p className="mb-4 text-stone-600">Your cart is empty.</p>
        <Link href="/" className="rounded-lg bg-emerald-700 px-5 py-2 text-white">Browse books</Link>
      </div>
    );

  const cur = quote.currency;
  const blocked = quote.lines.some((l: any) => !l.purchasable);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {quote.lines.map((l: any) => (
          <li key={l.bookId} className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-stone-100 text-3xl text-stone-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.imageUrl ? <img src={l.imageUrl} alt="" className="h-full w-full object-cover" /> : "📖"}
            </div>
            <div className="flex-1 space-y-1">
              <Link href={`/books/${l.slug}`} className="font-semibold hover:underline">{l.title}</Link>
              {l.author && <p className="text-sm text-stone-500">{l.author}</p>}
              {!l.purchasable && <p className="text-sm font-medium text-red-700">No longer available to order — remove it to continue.</p>}
              <div className="flex items-center gap-3 pt-1 text-sm">
                <label className="flex items-center gap-1">
                  Qty
                  <select value={l.qty} onChange={(e) => setQty(l.bookId, Number(e.target.value))} className="rounded border border-stone-300 px-1 py-0.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
                  </select>
                </label>
                <button onClick={() => remove(l.bookId)} className="text-red-700 underline">Remove</button>
              </div>
            </div>
            <div className="font-semibold">{l.unitPriceCents === null ? "—" : formatMoney(l.unitPriceCents * l.qty, cur)}</div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatMoney(quote.totals.subtotalCents, cur)}</span></div>
        <div className="flex justify-between text-sm"><span>Shipping (worldwide flat rate)</span><span>{formatMoney(quote.totals.shippingCents, cur)}</span></div>
        <div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatMoney(quote.totals.totalCents, cur)}</span></div>
        {blocked ? (
          <button disabled className="w-full cursor-not-allowed rounded-lg bg-stone-200 py-2.5 text-stone-500">Remove unavailable items</button>
        ) : (
          <Link href="/checkout" className="block w-full rounded-lg bg-emerald-700 py-2.5 text-center font-medium text-white hover:bg-emerald-800">Checkout</Link>
        )}
      </aside>
    </div>
  );
}
