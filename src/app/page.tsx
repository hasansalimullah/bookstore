import Link from "next/link";
import { listPublicBooks } from "@/lib/books";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import { formatMoney } from "@/lib/shop";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let books: Awaited<ReturnType<typeof listPublicBooks>> = [];
  let failed = false;
  try {
    books = await listPublicBooks(q);
  } catch {
    failed = true;
  }

  return (
    <>
      <form action="/" className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search books or authors…"
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 outline-none focus:border-emerald-600"
        />
        <button className="rounded-lg bg-emerald-700 px-5 py-2 text-white hover:bg-emerald-800">Search</button>
      </form>

      {failed && <p className="rounded bg-amber-50 p-4 text-amber-800">Could not load books right now. Please try again later.</p>}
      {!failed && books.length === 0 && <p className="text-stone-500">No books found.</p>}

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <li key={b.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
            <Link href={`/books/${b.slug}`} className="block">
              <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 text-5xl text-stone-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.imageUrl ? <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" /> : "📖"}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="text-lg font-bold">{b.title}</h2>
                {b.author && <p className="text-sm text-stone-500">{b.author}</p>}
                {b.priceCents !== null && <p className="font-semibold text-emerald-800">{formatMoney(b.priceCents, config.currency)}</p>}
                <AvailabilityBadge value={b.availability} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
