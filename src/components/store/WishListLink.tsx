"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartIcon } from "./icons";

const KEY = "wishlist-v1";

/** Heart icon in the header with a small count of saved books. */
export default function WishlistLink() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        setN(Array.isArray(v) ? v.length : 0);
      } catch {
        setN(0);
      }
    };
    read();
    window.addEventListener("wishlist:changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("wishlist:changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return (
    <Link href="/wishlist" aria-label="Wishlist">
      <HeartIcon />
      {n > 0 ? <span className="sf-badge">{n}</span> : null}
    </Link>
  );
}