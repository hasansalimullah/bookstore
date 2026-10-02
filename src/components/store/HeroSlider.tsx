"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/content/site";

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);
  if (!n) return null;
  return (
    <div className="sf-herowrap">
      <div className="sf-hero">
        {slides.map((s, k) => (
          <Link key={k} href={s.href} className={`sf-slide${k === i ? " on" : ""}`} aria-hidden={k !== i}>
            {s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="full" src={s.image} alt={s.title} />
            ) : (
              <>
                <div className="sf-slide-bg" />
                <div className="sf-slide-text">
                  <h2>{s.title}</h2>
                  <h3>{s.subtitle}</h3>
                  <p>{s.text}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.bookImage && <img className="sf-slide-book" src={s.bookImage} alt="" />}
              </>
            )}
          </Link>
        ))}
        {n > 1 && (
          <div className="sf-dots">
            {slides.map((_, k) => (
              <button key={k} className={k === i ? "on" : ""} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
