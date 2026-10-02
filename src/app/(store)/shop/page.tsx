import { listBooks } from "@/lib/books";
import { config } from "@/lib/config";
import ProductCard from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Books" };

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const { q, category, sort } = await searchParams;
  let books: Awaited<ReturnType<typeof listBooks>> = [];
  let failed = false;
  try {
    books = await listBooks({ q, category, sort: sort === "new" ? "new" : sort === "title" ? "title" : undefined });
  } catch {
    failed = true;
  }
  const heading = q ? `Results for “${q}”` : category ? category.split("|").join(" / ").toUpperCase() : sort === "new" ? "NEW RELEASES" : "ALL BOOKS";
  return (
    <div className="sf-shop">
      <div className="sf-section" style={{ padding: 0 }}>
        <h2 style={{ paddingLeft: 46 }}>{heading}</h2>
        <div className="rule" />
      </div>
      {failed && <p style={{ padding: "30px 46px", color: "#8a6a1e" }}>Could not load books right now. Please try again later.</p>}
      {!failed && books.length === 0 && <p style={{ padding: "30px 46px", color: "#666" }}>No books found.</p>}
      <div className="sf-grid">
        {books.map((b) => <ProductCard key={b.id} book={b} currency={config.currency} />)}
      </div>
    </div>
  );
}
