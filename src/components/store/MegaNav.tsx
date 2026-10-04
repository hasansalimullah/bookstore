"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { NavItem } from "@/content/site";
import { formatMoney } from "@/lib/shop";
import { HomeIcon } from "./icons";

interface Mini {
  id: number;
  slug: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
}

export default function MegaNav({ items, currency }: { items: NavItem[]; currency: string }) {
  const [open, setOpen] = useState<number | null>(null); // desktop: hovered item
  const [sub, setSub] = useState<number | null>(null); // mobile: expanded item
  const [burger, setBurger] = useState(false);
  const [feat, setFeat] = useState<Record<string, Mini[]>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadFeatured(key: string) {
    if (feat[key] !== undefined) return;
    setFeat((f) => ({ ...f, [key]: [] }));
    try {
      let list: Mini[] = [];
      if (key) {
        const r = await fetch(`/api/books?category=${encodeURIComponent(key)}&limit=4`);
        list = ((await r.json()) as { books?: Mini[] }).books ?? [];
      }
      if (!list.length) {
        const r = await fetch("/api/books?sort=new&limit=4");
        list = ((await r.json()) as { books?: Mini[] }).books ?? [];
      }
      setFeat((f) => ({ ...f, [key]: list }));
    } catch {
      /* ignore: dropdown just shows links */
    }
  }

  const enter = (i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(i);
    const m = items[i].menu;
    if (m) void loadFeatured(m.featured ?? "");
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
        {items.map((n, i) => (
          <li
            key={n.label}
            className={`mm-item${open === i ? " hot" : ""}${sub === i ? " sub" : ""}`}
            onMouseEnter={() => enter(i)}
            onMouseLeave={leave}
            onFocus={() => enter(i)}
          >
            {i > 0 && <span className="sep">|</span>}
            <Link href={n.href} className={n.active ? "active" : ""} onClick={close}>{n.label}</Link>
            {n.menu && (
              <button className="mm-toggle" aria-label={`Show ${n.label} menu`} onClick={() => setSub(sub === i ? null : i)}>
                {sub === i ? "–" : "+"}
              </button>
            )}
            {n.menu && (
              <div className="mm-panel">
                <div className="mm-in">
                  <div className="mm-cols">
                    {n.menu.columns.map((c) => (
                      <div key={c.title} className="mm-col">
                        <h4>{c.title}</h4>
                        <ul>
                          {c.links.map((l) => (
                            <li key={l.label}><Link href={l.href} onClick={close}>{l.label}</Link></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mm-feat">
                    {(feat[n.menu.featured ?? ""] ?? []).map((b) => (
                      <Link key={b.id} href={`/books/${b.slug}`} className="mm-prod" onClick={close}>
                        <div className="im">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {b.imageUrl ? <img src={b.imageUrl} alt="" loading="lazy" /> : null}
                        </div>
                        <b dir="auto">{b.title}</b>
                        {b.priceCents !== null && <span>{formatMoney(b.priceCents, currency)}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}