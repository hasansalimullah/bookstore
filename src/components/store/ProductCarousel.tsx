"use client";
import { useRef } from "react";
import type { PublicBook } from "@/lib/books";
import ProductCard from "./ProductCard";
import { Chevron } from "./icons";

export default function ProductCarousel({ books, currency }: { books: PublicBook[]; currency: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="sf-carousel">
      <button className="sf-arrow l" aria-label="Previous" onClick={() => go(-1)}><Chevron dir="l" /></button>
      <div className="sf-track" ref={ref}>
        {books.map((b) => <ProductCard key={b.id} book={b} currency={currency} />)}
      </div>
      <button className="sf-arrow r" aria-label="Next" onClick={() => go(1)}><Chevron dir="r" /></button>
    </div>
  );
}
