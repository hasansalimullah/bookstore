export interface CatalogRow {
  id: number;
  title: string;
  titleAr: string | null;
  author: string | null;
  category: string | null;
  edition: string | null;
  cover: string | null;
  harakat: string | null;
  priceCents: number | null;
  availability: string;
  createdAt: string | null;
}

export const PAGE_SIZE = 24;
export const FACETS = ["cat", "author", "edition", "cover", "harakat"] as const;
export type FacetKey = (typeof FACETS)[number];
export type Sort = "relevance" | "new" | "price-asc" | "price-desc" | "title";
const SORTS: Sort[] = ["relevance", "new", "price-asc", "price-desc", "title"];

export interface Filters {
  q: string;
  scope: string; // "a|b" category words from the menu links
  cat: string[];
  author: string[];
  edition: string[];
  cover: string[];
  harakat: string[];
  stock: boolean;
  sort: Sort;
  page: number;
}

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

export function parseFilters(sp: SP): Filters {
  const sort = first(sp.sort) as Sort;
  return {
    q: first(sp.q).trim().slice(0, 100),
    scope: first(sp.category).trim().slice(0, 100),
    cat: many(sp.cat),
    author: many(sp.author),
    edition: many(sp.edition),
    cover: many(sp.cover),
    harakat: many(sp.harakat),
    stock: first(sp.stock) === "1",
    sort: SORTS.includes(sort) ? sort : "relevance",
    page: Math.max(1, Math.min(500, parseInt(first(sp.page), 10) || 1)),
  };
}

/** Last part of "Fiqh & Ahkam > Fiqh Hanbali > Usul Madhhab". */
export function leafCategory(category: string | null): string | null {
  const parts = (category ?? "").split(">").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

function valueOf(r: CatalogRow, key: FacetKey): string | null {
  return key === "cat" ? leafCategory(r.category) : r[key];
}

function matchesScope(r: CatalogRow, f: Filters): boolean {
  const q = norm(f.q);
  if (q && !(norm(r.title).includes(q) || norm(r.titleAr).includes(q) || norm(r.author).includes(q))) return false;
  const words = f.scope.split("|").map(norm).filter(Boolean);
  if (words.length && !words.some((w) => norm(r.category).includes(w))) return false;
  return true;
}

function matchesFacet(r: CatalogRow, f: Filters, key: FacetKey): boolean {
  const sel = f[key];
  if (!sel.length) return true;
  const v = norm(valueOf(r, key));
  return sel.some((s) => norm(s) === v);
}

/** Rows that pass every filter (optionally ignoring one facet, which is how facet counts stay useful). */
export function applyFilters(rows: CatalogRow[], f: Filters, skip?: FacetKey): CatalogRow[] {
  return rows.filter((r) => matchesScope(r, f) && FACETS.every((k) => k === skip || matchesFacet(r, f, k)) && (!f.stock || r.availability === "available"));
}

export interface FacetOption {
  value: string;
  count: number;
  selected: boolean;
}

export function facetOptions(rows: CatalogRow[], f: Filters, key: FacetKey): FacetOption[] {
  const counts = new Map<string, { label: string; n: number }>();
  for (const r of applyFilters(rows, f, key)) {
    const v = valueOf(r, key);
    if (!v || !v.trim()) continue;
    const k = norm(v);
    const e = counts.get(k);
    if (e) e.n++;
    else counts.set(k, { label: v.trim(), n: 1 });
  }
  for (const s of f[key]) if (!counts.has(norm(s))) counts.set(norm(s), { label: s, n: 0 });
  return [...counts.entries()]
    .map(([k, v]) => ({ value: v.label, count: v.n, selected: f[key].some((s) => norm(s) === k) }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function sortRows(rows: CatalogRow[], f: Filters): CatalogRow[] {
  const byNew = (a: CatalogRow, b: CatalogRow) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "") || b.id - a.id;
  const price = (r: CatalogRow, dir: 1 | -1) => (r.priceCents === null ? Number.POSITIVE_INFINITY : r.priceCents * dir);
  const out = [...rows];
  if (f.sort === "price-asc") return out.sort((a, b) => price(a, 1) - price(b, 1) || byNew(a, b));
  if (f.sort === "price-desc") return out.sort((a, b) => (a.priceCents === null ? 1 : 0) - (b.priceCents === null ? 1 : 0) || (b.priceCents ?? 0) - (a.priceCents ?? 0) || byNew(a, b));
  if (f.sort === "title") return out.sort((a, b) => a.title.localeCompare(b.title));
  if (f.sort === "relevance" && f.q) {
    const q = norm(f.q);
    const rank = (r: CatalogRow) => (norm(r.title).startsWith(q) ? 0 : norm(r.title).includes(q) ? 1 : 2);
    return out.sort((a, b) => rank(a) - rank(b) || byNew(a, b));
  }
  return out.sort(byNew);
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length };
}

/** Builds a /shop URL for the given filters (used for every link on the page). */
export function hrefFor(f: Filters, change?: (g: Filters) => void): string {
  const g: Filters = { ...f, cat: [...f.cat], author: [...f.author], edition: [...f.edition], cover: [...f.cover], harakat: [...f.harakat] };
  if (change) change(g);
  const p = new URLSearchParams();
  if (g.q) p.set("q", g.q);
  if (g.scope) p.set("category", g.scope);
  for (const k of FACETS) for (const v of g[k]) p.append(k, v);
  if (g.stock) p.set("stock", "1");
  if (g.sort !== "relevance") p.set("sort", g.sort);
  if (g.page > 1) p.set("page", String(g.page));
  const s = p.toString();
  return s ? `/shop?${s}` : "/shop";
}

export function toggleFacet(f: Filters, key: FacetKey, value: string): string {
  return hrefFor(f, (g) => {
    const has = g[key].some((s) => norm(s) === norm(value));
    g[key] = has ? g[key].filter((s) => norm(s) !== norm(value)) : [...g[key], value];
    g.page = 1;
  });
}

export function activeFilterCount(f: Filters): number {
  return FACETS.reduce((n, k) => n + f[k].length, 0) + (f.stock ? 1 : 0);
}