"use client";
import { useEffect, useState } from "react";
import { PinIcon } from "./icons";

export default function Topbar({ country, messages, language, currency }: { country: string; messages: string[]; language: string; currency: string }) {
  const [i, setI] = useState(0);
  const n = messages.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);
  return (
    <div className="sf-topbar">
      <div className="sf-topbar-in">
        <div className="loc"><PinIcon /> {country}</div>
        <div className="ann">
          <button aria-label="Previous" onClick={() => setI((i - 1 + n) % n)}>&lt;</button>
          <span>{messages[i]}</span>
          <button aria-label="Next" onClick={() => setI((i + 1) % n)}>&gt;</button>
        </div>
        <div className="right"><span>{language}</span><span>{currency}</span></div>
      </div>
    </div>
  );
}
