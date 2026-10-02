"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicBook } from "@/lib/books";
import { formatMoney } from "@/lib/shop";
import { useCart } from "@/components/cart/CartProvider";
import { HeartIcon, ShareIcon } from "./icons";

const WISH = "wishlist-v1";

export default function ProductDetail({ book, currency }: { book: PublicBook; currency: string }) {
  const { add } = useCart();
  const [sel, setSel] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      setWished((JSON.parse(localStorage.getItem(WISH) ?? "[]") as number[]).includes(book.id));
    } catch {
      /* ignore */
    }
  }, [book.id]);

  const canBuy = book.availability === "available" && book.priceCents !== null;
  const images = book.images;
  const main = images[sel] ?? images[0] ?? null;
  const crumbs = (book.category ?? "").split(">").map((s) => s.trim()).filter(Boolean);
  const last = book.author ?? book.title;

  const left = [["Edition", book.edition], ["Cover", book.cover], ["Print Quality", book.printQuality]].filter(([, v]) => v) as [string, string][];
  const right = [["Format", book.format], ["Harakat", book.harakat]].filter(([, v]) => v) as [string, string][];

  function toggleWish() {
    try {
      const cur = JSON.parse(localStorage.getItem(WISH) ?? "[]") as number[];
      const next = cur.includes(book.id) ? cur.filter((x) => x !== book.id) : [...cur, book.id];
      localStorage.setItem(WISH, JSON.stringify(next));
      setWished(next.includes(book.id));
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: book.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      /* cancelled */
    }
  }

  const stock = book.availability === "available" ? ["in", "In stock"] : book.availability === "out_of_stock" ? ["out", "Out of stock"] : ["chk", "Checking availability…"];

  return (
    <>
      <div className="sf-crumbs">
        <Link href="/">Home</Link>
        {crumbs.map((c) => (
          <span key={c}>/ <Link href={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link></span>
        ))}
        <span>/ {last}</span>
      </div>

      <div className="sf-product">
        <div>
          <div className="sf-gal-main">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main} alt={book.title} />
            ) : (
              <span style={{ color: "#aaa" }}>No image</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="sf-thumbs">
              {images.slice(0, 3).map((u, i) => (
                <button key={u + i} className={i === sel ? "sel" : ""} onClick={() => setSel(i)} aria-label={`Image ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sf-info">
          <h1 dir="auto">{book.title}</h1>
          {book.titleAr && book.titleAr !== book.title && <p className="ar sf-ar">{book.titleAr}</p>}
          {book.priceCents !== null && <p className="price">{formatMoney(book.priceCents, currency)}</p>}
          <span className={`sf-stock ${stock[0]}`}>{stock[1]}</span>

          {book.description && <div className="sf-box sf-desc" dir="auto">{book.description}</div>}

          {(left.length > 0 || right.length > 0) && (
            <div className="sf-box sf-specs">
              <div>{left.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span dir="auto">{v}</span></div>)}</div>
              <div>{right.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span dir="auto">{v}</span></div>)}</div>
            </div>
          )}

          <div className="sf-buy">
            <div className="sf-qty">
              <button aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}>—</button>
              <input value={qty} readOnly aria-label="Quantity" />
              <button aria-label="Increase" onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button
              className="sf-add"
              disabled={!canBuy}
              onClick={() => {
                add(book.id, qty);
                setAdded(true);
                setTimeout(() => setAdded(false), 2500);
              }}
            >
              {canBuy ? "ADD TO CART" : book.priceCents === null ? "PRICE NOT SET" : book.availability === "out_of_stock" ? "OUT OF STOCK" : "UNAVAILABLE"}
            </button>
            <button
              className="sf-now"
              disabled={!canBuy}
              onClick={() => {
                add(book.id, qty);
                window.location.href = "/checkout";
              }}
            >
              Buy Now
            </button>
            <div className="sf-iconbtns">
              <button aria-label="Wishlist" onClick={toggleWish}>
                <HeartIcon fill={wished ? "#f28c28" : "#fff"} stroke="#f28c28" size={14} />
              </button>
              <button aria-label="Share" onClick={share}><ShareIcon /></button>
            </div>
          </div>
          {(added || shareMsg) && (
            <p className="sf-added">
              {added ? (<>Added to cart ✓ <Link href="/cart" style={{ textDecoration: "underline" }}>View cart</Link></>) : shareMsg}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
