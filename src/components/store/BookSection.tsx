import { config } from "@/lib/config";
import { listSection } from "@/lib/books";
import ProductCarousel from "./ProductCarousel";

export default async function BookSection({ title, category, limit = 10, tight = false }: { title: string; category: string; limit?: number; tight?: boolean }) {
  const books = await listSection(category, limit).catch(() => []);
  if (!books.length) return null;
  return (
    <section className={`sf-section${tight ? " tight" : ""}`}>
      <h2>{title}</h2>
      <div className="rule" />
      <ProductCarousel books={books} currency={config.currency} />
    </section>
  );
}
