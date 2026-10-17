import { config } from "@/lib/config";
import { listSection } from "@/lib/books";
import ProductCarousel from "./ProductCarousel";

export default async function BookSection({ title, category, limit = 10 }: { title: string; category: string; limit?: number }) {
  const books = await listSection(category, limit).catch(() => []);
  if (!books.length) return null;
  return (
    <section className="sf-section">
      <h2>{title}</h2>
      <div className="rule" />
      <ProductCarousel books={books} currency={config.currency} />
    </section>
  );
}
