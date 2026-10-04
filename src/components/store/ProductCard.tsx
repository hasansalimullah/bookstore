import Link from "next/link";
import type { PublicBook } from "@/lib/books";
import { formatMoney } from "@/lib/shop";
import WishHeart from "./WishHeart";

const NEW_DAYS = 30;

export default function ProductCard({ book, currency }: { book: PublicBook; currency: string }) {
  const sub = book.titleAr && book.titleAr !== book.title ? book.titleAr : null;
  const isNew = book.createdAt ? Date.now() - new Date(book.createdAt).getTime() < NEW_DAYS * 86_400_000 : false;
  const second = book.images[1] ?? null; // shown when hovering the card
  return (
    <div className="sf-card">
      {isNew && <span className="sf-flag">New Release</span>}
      <WishHeart id={book.id} />
      <Link href={`/books/${book.slug}`} className="lnk">
        <div className="img">
          {book.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="main" src={book.imageUrl} alt={book.title} loading="lazy" />
          ) : (
            <div className="noimg" dir="auto">{book.title}</div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {second && <img className="alt" src={second} alt="" loading="lazy" />}
        </div>
        <p className="t" dir="auto">{book.title}</p>
        {sub && <p className="a sf-ar">{sub}</p>}
        {book.priceCents !== null && <p className="p">{formatMoney(book.priceCents, currency)}</p>}
        {book.availability === "out_of_stock" && <p className="oos">Out of stock</p>}
      </Link>
    </div>
  );
}