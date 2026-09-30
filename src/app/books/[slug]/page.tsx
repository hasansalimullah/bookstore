import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBook } from "@/lib/books";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import AddToCart from "@/components/cart/AddToCart";
import { formatMoney } from "@/lib/shop";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await getPublicBook(slug).catch(() => null);
  if (!b) return { title: "Not found" };
  // Metadata only ever comes from PublicBook — no source URL is available here.
  return {
    title: b.title,
    description: b.description?.slice(0, 160) ?? `${b.title} — ${b.author ?? ""}`,
    openGraph: { title: b.title, images: b.imageUrl ? [b.imageUrl] : undefined },
  };
}

const SCHEMA_AVAIL = { available: "https://schema.org/InStock", out_of_stock: "https://schema.org/OutOfStock" } as const;

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getPublicBook(slug).catch(() => null);
  if (!book) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.author ? { author: { "@type": "Person", name: book.author } } : {}),
    ...(book.imageUrl ? { image: book.imageUrl } : {}),
    ...(book.availability !== "unknown"
      ? { offers: { "@type": "Offer", availability: SCHEMA_AVAIL[book.availability], ...(book.priceCents !== null ? { price: (book.priceCents / 100).toFixed(2), priceCurrency: config.currency.toUpperCase() } : {}) } }
      : {}),
  };

  return (
    <article className="grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 text-7xl text-stone-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {book.imageUrl ? <img src={book.imageUrl} alt={book.title} className="h-full w-full object-cover" /> : "📖"}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{book.title}</h1>
        {book.author && <p className="text-stone-600">Author: {book.author}</p>}
        {book.priceCents !== null && <p className="text-2xl font-semibold text-emerald-800">{formatMoney(book.priceCents, config.currency)}</p>}
        <AvailabilityBadge value={book.availability} className="text-base" />
        <AddToCart
          bookId={book.id}
          canBuy={book.availability === "available" && book.priceCents !== null}
          reason={book.priceCents === null ? "Price not set" : book.availability === "out_of_stock" ? "Out of stock" : "Currently unavailable"}
        />
        {book.lastChecked && (
          <p className="text-xs text-stone-500">
            Last updated: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(book.lastChecked))} (UTC)
          </p>
        )}
        {book.description && <p className="whitespace-pre-line leading-8 text-stone-700">{book.description}</p>}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
