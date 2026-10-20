"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { PublicBook } from "@/lib/books";
import ProductCard from "./ProductCard";

const KEY = "wishlist-v1";

function readIds(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => Number.isInteger(x)) : [];
  } catch {
    return [];
  }
}

export default function WishlistView({ currency }: { currency: string }) {
  const { add } = useCart();
  const [ids, setIds] = useState<number[] | null>(null);
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sync = () => setIds(readIds());
    sync();
    window.addEventListener("wishlist:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wishlist:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Fetch the books once per set of ids (removals just filter what we already have)
  useEffect(() => {
    if (!ids || !ids.length) return;
    const missing = ids.filter((id) => !books.some((b) => b.id === id));
    if (!missing.length) return;
    let stop = false;
    fetch(`/api/books?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => !stop && (d.books ? setBooks(d.books) : setFailed(true)))
      .catch(() => !stop && setFailed(true));
    return () => {
      stop = true;
    };
  }, [ids, books]);

  const shown = ids ? ids.flatMap((id) => books.filter((b) => b.id === id)) : [];

  return (
    <>
      {ids === null && <p className="sf-note">Loading…</p>}
      {ids !== null && ids.length === 0 && (
        <div className="sf-empty">
          <p>You haven&apos;t saved any books yet.</p>
          <p>Tap the ♡ on a book to keep it here for later.</p>
          <Link href="/shop" className="sf-darkbtn">Browse books</Link>
        </div>
      )}
      {failed && <p className="sf-note">Could not load your saved books. Please refresh.</p>}
      <div className="sf-grid sf-grid-shop sf-wishgrid">
        {shown.map((b) => {
          const canBuy = b.availability === "available" && b.priceCents !== null;
          return (
            <div key={b.id} className="sf-wishitem">
              <ProductCard book={b} currency={currency} />
              <button type="button" className="sf-addbtn" disabled={!canBuy} onClick={() => add(b.id)}>
                {canBuy ? "ADD TO CART" : "UNAVAILABLE"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="sf-backrow">
        <Link href="/account">‹ Back to your account</Link>
        <Link href="/">⌂ Home</Link>
      </p>
    </>
  );
}