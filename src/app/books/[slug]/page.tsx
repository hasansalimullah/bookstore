import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBook } from "@/lib/books";
import AvailabilityBadge from "@/components/AvailabilityBadge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await getPublicBook(slug).catch(() => null);
  if (!b) return { title: "غير موجود" };
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
      ? { offers: { "@type": "Offer", availability: SCHEMA_AVAIL[book.availability] } }
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
        {book.author && <p className="text-stone-600">المؤلف: {book.author}</p>}
        <AvailabilityBadge value={book.availability} className="text-base" />
        {book.lastChecked && (
          <p className="text-xs text-stone-500">
            آخر تحديث: {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(book.lastChecked))} (UTC)
          </p>
        )}
        {book.description && <p className="whitespace-pre-line leading-8 text-stone-700">{book.description}</p>}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
