import { cache } from "react";
import { site, type SectionDef } from "@/content/site";
import { listBooks, type PublicBook } from "./books";
import { seededShuffle, slotOf } from "./rotation";

export interface PickedSection {
  title: string;
  books: PublicBook[];
}
export interface PickedPromo {
  title: string;
  text: string;
  href: string;
  image: string | null;
  button: string;
}

const MIN_BOOKS = 3;
const PER_ROW = 10;

async function fetchSection(def: SectionDef, slot: number): Promise<PickedSection | null> {
  try {
    let books: PublicBook[] = [];
    if (def.kind === "random") books = seededShuffle(await listBooks({ sort: "new", limit: 60 }), slot).slice(0, PER_ROW);
    else if (def.kind === "newest") books = await listBooks({ sort: "new", limit: PER_ROW });
    else if (def.category) books = await listBooks({ category: def.category, limit: PER_ROW });
    else if (def.q) books = await listBooks({ q: def.q, limit: PER_ROW });
    return books.length >= MIN_BOOKS ? { title: def.title, books } : null;
  } catch {
    return null;
  }
}

function clip(s: string | null, n: number): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

async function pickPromos(slot: number): Promise<PickedPromo[]> {
  try {
    const all = await listBooks({ sort: "new", limit: 80 });
    const withPic = all.filter((b) => b.imageUrl);
    const pool = withPic.filter((b) => b.description && b.description.trim().length > 20);
    const source = pool.length >= 2 ? pool : withPic;
    if (source.length < 2) return [];
    return seededShuffle(source, slot)
      .slice(0, 2)
      .map((b) => ({
        title: b.title,
        text: clip(b.description, 125) || clip(b.author, 80),
        href: `/books/${b.slug}`,
        image: b.imageUrl,
        button: "DISCOVER",
      }));
  } catch {
    return [];
  }
}

/** Computed once per request even if several components ask for it. */
export const getHomePicks = cache(async (): Promise<{ sections: PickedSection[]; promos: PickedPromo[] }> => {
  const now = Date.now();
  const secSlot = slotOf(now, site.rotation.sectionsHours);
  const promoSlot = slotOf(now, site.rotation.promosHours);
  const order = seededShuffle(site.sectionPool, secSlot);

  const sections: PickedSection[] = [];
  const promosP = pickPromos(promoSlot);
  for (let i = 0; i < order.length && sections.length < 2; i += 3) {
    const batch = await Promise.all(order.slice(i, i + 3).map((d) => fetchSection(d, secSlot)));
    for (const s of batch) if (s && sections.length < 2) sections.push(s);
  }
  if (sections.length < 2) {
    const fill = await fetchSection({ title: "NEW ARRIVALS", kind: "newest" }, secSlot);
    if (fill && !sections.some((s) => s.title === fill.title)) sections.push(fill);
  }
  return { sections, promos: await promosP };
});