import Link from "next/link";
import { site } from "@/content/site";
import { config } from "@/lib/config";
import { getHomePicks } from "@/lib/home-picks";
import ProductCarousel from "./ProductCarousel";

export async function HomeCarousel({ index, tight = false }: { index: number; tight?: boolean }) {
  const { sections } = await getHomePicks();
  const sec = sections[index];
  if (!sec) return null;
  return (
    <section className={`sf-section${tight ? " tight" : ""}`}>
      <h2>{sec.title}</h2>
      <div className="rule" />
      <ProductCarousel books={sec.books} currency={config.currency} />
    </section>
  );
}

export async function HomePromos() {
  const { promos } = await getHomePicks();
  const cards = promos.length === 2 ? promos : site.promos.map((p) => ({ title: p.title, text: p.text, href: p.href, image: p.image, button: p.button }));
  return (
    <div className="sf-promos">
      {cards.map((p, i) => (
        <div key={i} className="sf-promo sf-pattern">
          <h3 dir="auto">{p.title}</h3>
          <p dir="auto">{p.text}</p>
          <Link href={p.href} className="btn">{p.button}</Link>
          {p.image && (
            <div className={`pic${promos.length === 2 ? " cover" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
