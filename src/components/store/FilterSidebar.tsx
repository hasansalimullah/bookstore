import Link from "next/link";
import { activeFilterCount, hrefFor, toggleFacet, type FacetKey, type FacetOption, type Filters } from "@/lib/catalog";

export interface FacetGroup {
  key: FacetKey;
  label: string;
  options: FacetOption[];
}

const SHOWN = 6;

export default function FilterSidebar({ f, groups }: { f: Filters; groups: FacetGroup[] }) {
  const active = activeFilterCount(f);
  const item = (g: FacetGroup, o: FacetOption) => (
    <li key={o.value}>
      <Link href={toggleFacet(f, g.key, o.value)} className={o.selected ? "on" : ""} rel="nofollow">
        <i className="box">{o.selected ? "✓" : ""}</i>
        <span dir="auto">{o.value}</span>
        <em>({o.count})</em>
      </Link>
    </li>
  );
  return (
    <aside className="sf-filters" id="filters">
      <h3 className="fh">Filter by</h3>
      {active > 0 && <Link href={hrefFor({ ...f, cat: [], author: [], edition: [], cover: [], harakat: [], stock: false, page: 1 })} className="clear" rel="nofollow">Clear all filters</Link>}
      <div className="fg">
        <ul>
          <li>
            <Link href={hrefFor(f, (g) => { g.stock = !g.stock; g.page = 1; })} className={f.stock ? "on" : ""} rel="nofollow">
              <i className="box">{f.stock ? "✓" : ""}</i><span>In stock only</span>
            </Link>
          </li>
        </ul>
      </div>
      {groups.map((g) => (
        <details key={g.key} open className="fg">
          <summary>{g.label}</summary>
          <ul>{g.options.slice(0, SHOWN).map((o) => item(g, o))}</ul>
          {g.options.length > SHOWN && (
            <details className="more">
              <summary>Show {g.options.length - SHOWN} more</summary>
              <ul>{g.options.slice(SHOWN).map((o) => item(g, o))}</ul>
            </details>
          )}
        </details>
      ))}
    </aside>
  );
}