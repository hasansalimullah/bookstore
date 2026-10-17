"use client";
import { useEffect, useState } from "react";
import { HeartIcon } from "./icons";

const KEY = "wishlist-v1";

export default function WishHeart({ id }: { id: number }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      setOn((JSON.parse(localStorage.getItem(KEY) ?? "[]") as number[]).includes(id));
    } catch {
      /* ignore */
    }
  }, [id]);

  function toggle() {
    try {
      const cur = JSON.parse(localStorage.getItem(KEY) ?? "[]") as number[];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      setOn(next.includes(id));
    } catch {
      /* ignore */
    }
  }

  return (
    <button type="button" className={`sf-heart${on ? " on" : ""}`} aria-label="Add to wishlist" onClick={toggle}>
      <HeartIcon fill={on ? "#f28c28" : "none"} stroke="#f28c28" size={16} />
    </button>
  );
}