import Link from "next/link";
import type { PublicBook } from "@/lib/books";
import { formatMoney } from "@/lib/shop";

export default function ProductCard({ book, currency }: { book: PublicBook; currency: string }) {
  const sub = book.titleAr && book.titleAr !== book.title ? book.titleAr : null;
  return (
    <Link href={`/books/${book.slug}`} className="sf-card">
      <div className="img">
        {book.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.imageUrl} alt={book.title} loading="lazy" />
        ) : (
          <div className="noimg" dir="auto">{book.title}</div>
        )}
      </div>
      <p className="t" dir="auto">{book.title}</p>
      {sub && <p className="a sf-ar">{sub}</p>}
      {book.priceCents !== null && <p className="p">{formatMoney(book.priceCents, currency)}</p>}
      {book.availability === "out_of_stock" && <p className="oos">Out of stock</p>}
    </Link>
  );
}
