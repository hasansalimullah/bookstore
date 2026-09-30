"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCart({ bookId, canBuy, reason }: { bookId: number; canBuy: boolean; reason?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (!canBuy) {
    return <button disabled className="cursor-not-allowed rounded-lg bg-stone-200 px-5 py-2.5 text-stone-500">{reason ?? "Unavailable"}</button>;
  }
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          add(bookId, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 2500);
        }}
        className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
      >
        Add to cart
      </button>
      {added && (
        <span className="text-sm text-emerald-800">
          Added ✓ <Link href="/cart" className="underline">View cart</Link>
        </span>
      )}
    </div>
  );
}
