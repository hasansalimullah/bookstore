"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/shop";
import { SearchIcon } from "./icons";

interface Hit {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
  priceCents: number | null;
}

export default function SearchBox({ currency }: { currency: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);

  // Live suggestions (debounced 250 ms)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/books?q=${encodeURIComponent(term)}&limit=6`, { signal: ctl.signal });
        const d = (await r.json()) as { books?: Hit[] };
        setHits(d.books ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q]);

  // Close when clicking elsewhere
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <form action="/shop" className="sf-search" role="search" ref={box} autoComplete="off">
      <SearchIcon />
      <input name="q" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)} placeholder="Search by title, Author, Keyword..." aria-label="Search" />
      {open && q.trim().length >= 2 && (
        <div className="sf-sugg">
          {hits.length === 0 ? (
            <p className="none">No results for “{q.trim()}”</p>
          ) : (
            <>
              {hits.map((h) => (
                <Link key={h.id} href={`/books/${h.slug}`} className="row" onClick={() => setOpen(false)}>
                  <span className="th">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.imageUrl ? <img src={h.imageUrl} alt="" /> : null}
                  </span>
                  <span className="tx">
                    <b dir="auto">{h.title}</b>
                    {h.author && <i dir="auto">{h.author}</i>}
                  </span>
                  {h.priceCents !== null && <span className="pr">{formatMoney(h.priceCents, currency)}</span>}
                </Link>
              ))}
              <Link href={`/shop?q=${encodeURIComponent(q.trim())}`} className="all" onClick={() => setOpen(false)}>
                View all results
              </Link>
            </>
          )}
        </div>
      )}
    </form>
  );
}