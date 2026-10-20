import Link from "next/link";
import { config } from "@/lib/config";
import { listBooksByIds } from "@/lib/books";
import { bestSellers, listCatalogRows } from "@/lib/catalog-db";
import { FACETS, applyFilters, facetOptions, hrefFor, paginate, parseFilters, sortRows, activeFilterCount, type CatalogRow } from "@/lib/catalog";
import ProductCard from "@/components/store/ProductCard";
import ProductCarousel from "@/components/store/ProductCarousel";
import FilterSidebar, { type FacetGroup } from "@/components/store/FilterSidebar";
import { FilterToggle, SortSelect } from "@/components/store/ShopControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Books" };

const LABELS = { cat: "Category", author: "Author", edition: "Edition", cover: "Cover", harakat: "Harakat" } as const;

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseFilters(await searchParams);

  let rows: CatalogRow[] = [];
  let failed = false;
  try {
    rows = await listCatalogRows();
  } catch {
    failed = true;
  }

  const matched = sortRows(applyFilters(rows, f), f);
  const pg = paginate(matched, f.page);
  const [books, best] = failed
    ? [[], []]
    : await Promise.all([listBooksByIds(pg.items.map((r) => r.id)).catch(() => []), bestSellers(f.scope, 10).catch(() => [])]);
  const groups: FacetGroup[] = FACETS.map((key) => ({ key, label: LABELS[key], options: facetOptions(rows, f, key) })).filter((g) => g.options.length > 0);

  const heading = f.q ? `RESULTS FOR “${f.q.toUpperCase()}”` : f.scope ? f.scope.split("|").join(" / ").toUpperCase() : f.sort === "new" ? "NEW RELEASES" : "ALL BOOKS";
  const keep: [string, string][] = [];
  if (f.q) keep.push(["q", f.q]);
  if (f.scope) keep.push(["category", f.scope]);
  for (const k of FACETS) for (const v of f[k]) keep.push([k, v]);
  if (f.stock) keep.push(["stock", "1"]);

  const pageLinks = Array.from({ length: pg.pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pg.pages || Math.abs(n - pg.page) <= 2);

  return (
    <div className="sf-shop">
      <nav className="sf-crumbs"><Link href="/">Home</Link> / <span>{f.scope ? f.scope.split("|")[0] : f.q ? "Search" : "Books"}</span></nav>

      <header className="sf-pagehead">
        <h1>{heading}</h1>
        <p>Browse the collection, then narrow it down with the filters.</p>
      </header>

      {failed && <p className="sf-note">Could not load books right now. Please try again later.</p>}

      <div className="sf-shopgrid">
        <div className="sf-shopside">
          <FilterToggle count={activeFilterCount(f)} />
          <FilterSidebar f={f} groups={groups} />
        </div>

        <section className="sf-results">
          <div className="sf-toolbar">
            <span className="cnt">{pg.total} result{pg.total === 1 ? "" : "s"}{f.q ? ` for “${f.q}”` : ""}</span>
            <SortSelect value={f.sort} keep={keep} />
          </div>

          {!failed && books.length === 0 && (
            <p className="sf-note">No books match these filters. {activeFilterCount(f) > 0 && <Link href={hrefFor({ ...f, cat: [], author: [], edition: [], cover: [], harakat: [], stock: false, page: 1 })}>Clear filters</Link>}</p>
          )}
          <div className="sf-grid sf-grid-shop">
            {books.map((b) => <ProductCard key={b.id} book={b} currency={config.currency} />)}
          </div>

          {pg.pages > 1 && (
            <nav className="sf-pager" aria-label="Pages">
              {pg.page > 1 && <Link href={hrefFor(f, (g) => { g.page = pg.page - 1; })} rel="prev">‹ Prev</Link>}
              {pageLinks.map((n, i) => (
                <span key={n}>
                  {i > 0 && n - pageLinks[i - 1] > 1 && <em>…</em>}
                  <Link href={hrefFor(f, (g) => { g.page = n; })} className={n === pg.page ? "on" : ""}>{n}</Link>
                </span>
              ))}
              {pg.page < pg.pages && <Link href={hrefFor(f, (g) => { g.page = pg.page + 1; })} rel="next">Next ›</Link>}
            </nav>
          )}
        </section>
      </div>

      {best.length >= 3 && (
        <section className="sf-section" style={{ marginTop: 40 }}>
          <h2>BEST SELLERS{f.scope ? " IN THIS CATEGORY" : ""}</h2>
          <div className="rule" />
          <ProductCarousel books={best} currency={config.currency} />
        </section>
      )}
    </div>
  );
}