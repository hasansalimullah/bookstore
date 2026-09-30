"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
      🛒 Cart{ready && count > 0 ? <span className="ml-1.5 rounded-full bg-emerald-700 px-1.5 py-0.5 text-xs text-white">{count}</span> : null}
    </Link>
  );
}
