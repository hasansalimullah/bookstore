import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBook } from "@/lib/books";
import { config } from "@/lib/config";
import ProductDetail from "@/components/store/ProductDetail";
import { GoldDivider } from "@/components/store/Divider";
import { Carousels, ClosingBlocks } from "@/components/store/LowerSections";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await getPublicBook(slug).catch(() => null);
  if (!b) return { title: "Not found" };
  // Metadata only ever comes from PublicBook — no source URL is available here.
  return {
    title: b.title,
    description: b.description?.slice(0, 160) ?? `${b.title}${b.author ? " — " + b.author : ""}`,
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
    <>
      <ProductDetail book={book} currency={config.currency} />
      <GoldDivider />
      <Carousels only={0} />
      <div style={{ height: 60 }} />
      <Carousels only={1} />
      <div style={{ height: 116 }} />
      <ClosingBlocks />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
