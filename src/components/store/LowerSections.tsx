import { site } from "@/content/site";
import BookSection from "./BookSection";
import { ContactBlock, LinkButtons, Promos, Stats } from "./Blocks";
import Newsletter from "./Newsletter";

/** Everything below the first block on the home page; the product page reuses the carousels + the blocks after them. */
export function Carousels({ only }: { only?: number }) {
  return (
    <>
      {site.sections.map((s, i) => (only === undefined || only === i ? <BookSection key={i} {...s} tight={i === 1} /> : null))}
    </>
  );
}

export function ClosingBlocks() {
  return (
    <>
      <ContactBlock />
      <div style={{ height: 61 }} />
      <Stats />
      <div style={{ height: 92 }} />
      <Newsletter />
    </>
  );
}

export { Promos, LinkButtons };
