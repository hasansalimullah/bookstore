"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { NavItem } from "@/content/site";
import { sectionsFor, type AuthorGroup, type MenuData } from "@/lib/menu-tree";
import { formatMoney } from "@/lib/shop";
import { HomeIcon } from "./icons";

interface Mini {
  id: number;
  slug: string;
  title: string;
  titleAr: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  createdAt: string | null;
}

// One shared request for the menu data (categories + authors), made the first time a menu is opened.
let menuPromise: Promise<MenuData | null> | null = null;
function loadMenu(): Promise<MenuData | null> {
  if (!menuPromise) {
    menuPromise = fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => (d && d.tree ? (d as MenuData) : null))
      .catch(() => {
        menuPromise = null;
        return null;
      });
  }
  return menuPromise;
}

const isNew = (iso: string | null) => !!iso && Date.now() - Date.parse(iso) < 30 * 86_400_000;
const authorHref = (name: string) => `/shop?author=${encodeURIComponent(name)}`;

function NameList({ names, onPick }: { names: string[]; onPick: () => void }) {
  return (
    <ul className="mm-names">
      {names.map((n) => (
        <li key={n}><Link href={authorHref(n)} onClick={onPick} dir="auto">{n}</Link></li>
      ))}
    </ul>
  );
}

function Groups({ groups, onPick }: { groups: AuthorGroup[]; onPick: () => void }) {
  return (
    <div className="mm-accs">
      {groups.map((g) => (
        <details key={g.label}>
          <summary>{g.label}</summary>
          <NameList names={g.names} onPick={onPick} />
        </details>
      ))}
    </div>
  );
}

export default function MegaNav({ items, currency }: { items: NavItem[]; currency: string }) {
  const [open, setOpen] = useState<number | null>(null); // desktop: hovered item
  const [sub, setSub] = useState<number | null>(null); // mobile: expanded item
  const [burger, setBurger] = useState(false);
  const [feat, setFeat] = useState<Record<string, Mini[]>>({});
  const [data, setData] = useState<MenuData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadFeatured(key: string) {
    if (feat[key] !== undefined) return;
    setFeat((f) => ({ ...f, [key]: [] }));
    try {
      const url = key ? `/api/books?category=${encodeURIComponent(key)}&limit=4` : "/api/books?sort=new&limit=4";
      const list = ((await (await fetch(url)).json()) as { books?: Mini[] }).books ?? [];
      setFeat((f) => ({ ...f, [key]: list }));
    } catch {
      /* ignore: the menu just shows its links */
    }
  }

  const prepare = (i: number) => {
    const m = items[i].menu;
    if (!m) return;
    if ((m.auto || m.authors) && !data) void loadMenu().then((d) => d && setData(d));
    if (m.featured !== undefined) void loadFeatured(m.featured);
  };
  const enter = (i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(i);
    prepare(i);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 120);
  };
  const close = () => {
    setOpen(null);
    setSub(null);
    setBurger(false);
  };

  return (
    <nav className="sf-nav" aria-label="Main">
      <button className="sf-burger" aria-expanded={burger} onClick={() => setBurger(!burger)}>
        ☰ Menu
      </button>
      <ul className={`sf-menu${burger ? " open" : ""}`}>
        <li className="home">
          <Link href="/" aria-label="Home" onClick={close}><HomeIcon /></Link>
        </li>
        {items.map((n, i) => {
          const m = n.menu;
          const sections = m?.auto && data ? sectionsFor(data.tree, m.auto) : [];
          const columns = (m?.columns ?? []).map((c) => ({ title: c.title, links: c.links.map((l) => ({ label: l.label, href: l.href, count: 0 })) }));
          const all = [...sections, ...columns];
          const books = m?.featured !== undefined ? feat[m.featured] ?? [] : [];
          const au = data?.authors;
          const hasAuthors = !!au && (au.featured.length > 0 || au.byEra.length > 0 || au.byTag.length > 0);
          const loading = !!m && (m.auto || m.authors) && !data;
          const hasContent = m?.authors ? hasAuthors : all.length > 0 || books.length > 0;
          return (
            <li
              key={n.label}
              className={`mm-item${open === i ? " hot" : ""}${sub === i ? " sub" : ""}`}
              onMouseEnter={() => enter(i)}
              onMouseLeave={leave}
              onFocus={() => enter(i)}
            >
              {i > 0 && <span className="sep">|</span>}
              <Link href={n.href} className={n.active ? "active" : ""} onClick={close}>{n.label}</Link>
              {m && (
                <button
                  className="mm-toggle"
                  aria-label={`Show ${n.label} menu`}
                  onClick={() => {
                    setSub(sub === i ? null : i);
                    prepare(i);
                  }}
                >
                  {sub === i ? "–" : "+"}
                </button>
              )}
              {m && (hasContent || loading) && (
                <div className="mm-panel">
                  {!hasContent ? (
                    <p className="mm-loading">Loading…</p>
                  ) : m.authors && au ? (
                    <div className="mm-in mm-authors">
                      <section className="mm-acc">
                        <h4>Top authors</h4>
                        <NameList names={au.featured} onPick={close} />
                      </section>
                      {au.byEra.length > 0 && (
                        <section className="mm-acc">
                          <h4>In chronological order</h4>
                          <Groups groups={au.byEra} onPick={close} />
                        </section>
                      )}
                      {au.byTag.length > 0 && (
                        <section className="mm-acc">
                          <h4>In thematic order</h4>
                          <Groups groups={au.byTag} onPick={close} />
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className={`mm-in${books.length ? "" : " nobooks"}`}>
                      <div className="mm-cols">
                        {all.map((s, k) => (
                          <div key={`${s.title}-${k}`} className="mm-col">
                            {s.title && <h4>{s.title}</h4>}
                            <ul>
                              {s.links.map((l) => (
                                <li key={l.href}><Link href={l.href} onClick={close} dir="auto">{l.label}</Link></li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {books.length > 0 && (
                        <div className="mm-feat">
                          {books.map((b) => (
                            <Link key={b.id} href={`/books/${b.slug}`} className="mm-prod" onClick={close}>
                              <div className="im">
                                {isNew(b.createdAt) && <span className="rib">New release</span>}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {b.imageUrl ? <img src={b.imageUrl} alt="" loading="lazy" /> : null}
                              </div>
                              <b dir="auto">{b.title}</b>
                              {b.titleAr && <em dir="rtl">{b.titleAr}</em>}
                              {b.priceCents !== null && <span>{formatMoney(b.priceCents, currency)}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}