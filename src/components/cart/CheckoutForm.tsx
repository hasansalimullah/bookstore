"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

const EMPTY = { name: "", email: "", phone: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "" };

export default function CheckoutForm() {
  const { items, ready, clear } = useCart();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, customer: f }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setFields(data.fields ?? {});
        setBusy(false);
        return;
      }
      clear();
      window.location.href = data.url; // Stripe Checkout (or our order page in manual mode)
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (!ready) return <p className="text-stone-500">Loading…</p>;
  if (!items.length)
    return (
      <p className="py-10 text-center text-stone-600">
        Your cart is empty. <Link href="/" className="text-emerald-700 underline">Browse books</Link>
      </p>
    );

  const inp = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-emerald-600";
  const Field = ({ k, label, type = "text", required = false }: { k: keyof typeof EMPTY; label: string; type?: string; required?: boolean }) => (
    <label className="block text-sm">
      {label}{required && " *"}
      <input type={type} value={f[k]} onChange={set(k)} className={inp} />
      {fields[k] && <span className="text-xs text-red-700">{fields[k]}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-sm text-stone-600">Enter your shipping details. You&apos;ll pay securely on the next step.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field k="name" label="Full name" required />
        <Field k="email" label="Email" type="email" required />
        <Field k="phone" label="Phone (optional)" type="tel" />
        <Field k="country" label="Country" required />
      </div>
      <Field k="line1" label="Address line 1" required />
      <Field k="line2" label="Address line 2" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field k="city" label="City" required />
        <Field k="region" label="State / region" />
        <Field k="postalCode" label="Postal code" />
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex items-center gap-4">
        <button onClick={submit} disabled={busy} className="rounded-lg bg-emerald-700 px-6 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          {busy ? "Please wait…" : "Continue to payment"}
        </button>
        <Link href="/cart" className="text-sm text-stone-600 underline">Back to cart</Link>
      </div>
    </div>
  );
}
