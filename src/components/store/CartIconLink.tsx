"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/shop";
import { BagIcon } from "./icons";

interface Line {
  bookId: number;
  qty: number;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPriceCents: number | null;
}
interface Quote {
  lines: Line[];
  totals: { subtotalCents: number; discountCents: number };
  currency: string;
  discount: { code: string } | null;
}

/** Bag icon in the header + the little popup cart (opens on hover, on tap, and after "Add to cart"). */
export default function CartIconLink() {
  const { items, count, ready, remove, code } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const closeSoon = (ms: number) => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), ms);
  };

  // Close when the page changes
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Load current prices whenever the popup is open and the cart changes
  useEffect(() => {
    if (!open || !ready) return;
    if (!items.length) {
      setQuote(null);
      return;
    }
    let stop = false;
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, code }) })
      .then((r) => r.json())
      .then((d) => {
        if (!stop && !d.error) setQuote(d as Quote);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [open, ready, items, code]);

  // Pop open for a few seconds after a book is added
  useEffect(() => {
    const onAdd = () => {
      setOpen(true);
      closeSoon(5000);
    };
    window.addEventListener("cart:added", onAdd);
    return () => window.removeEventListener("cart:added", onAdd);
  }, []);

  // Click outside / Escape closes
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const lines = quote?.lines ?? [];

  return (
    <div
      className="sf-mini"
      ref={box}
      onMouseEnter={() => {
        cancelClose();
        if (canHover()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (canHover()) closeSoon(250);
      }}
    >
      <Link
        href="/cart"
        aria-label="Cart"
        onClick={(e) => {
          // On touch screens the first tap opens the popup instead of leaving the page
          if (!canHover() && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <BagIcon />
        {ready && count > 0 ? <span className="sf-badge">{count}</span> : null}
      </Link>

      {open && (
        <div className="sf-minipop" role="dialog" aria-label="Your cart">
          <div className="hd">
            <span>Your cart</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
          </div>
          {!items.length ? (
            <p className="empty">Your cart is empty.<br /><Link href="/shop">Browse books</Link></p>
          ) : !quote ? (
            <p className="empty">Loading…</p>
          ) : (
            <>
              <ul>
                {lines.slice(0, 5).map((l) => (
                  <li key={l.bookId}>
                    <Link href={`/books/${l.slug}`} className="th">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {l.imageUrl ? <img src={l.imageUrl} alt="" /> : null}
                    </Link>
                    <div className="tx">
                      <Link href={`/books/${l.slug}`}><b dir="auto">{l.title}</b></Link>
                      <span>{l.qty} × {l.unitPriceCents === null ? "—" : formatMoney(l.unitPriceCents, quote.currency)}</span>
                    </div>
                    <button type="button" className="rm" aria-label={`Remove ${l.title}`} onClick={() => remove(l.bookId)}>×</button>
                  </li>
                ))}
              </ul>
              {lines.length > 5 && <p className="more">+ {lines.length - 5} more in your cart</p>}
              <div className="sum">
                <div><span>Subtotal</span><b>{formatMoney(quote.totals.subtotalCents, quote.currency)}</b></div>
                {quote.totals.discountCents > 0 && <div className="disc"><span>Discount ({quote.discount?.code})</span><b>−{formatMoney(quote.totals.discountCents, quote.currency)}</b></div>}
                <small>Shipping is added at checkout.</small>
              </div>
              <div className="act">
                <Link href="/cart" className="b1">View cart</Link>
                <Link href="/checkout" className="b2">Checkout</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}