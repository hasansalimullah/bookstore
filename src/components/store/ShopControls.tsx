"use client";
import { useState } from "react";

/** Sort dropdown: submits the form as soon as a choice is made. */
export function SortSelect({ value, keep }: { value: string; keep: [string, string][] }) {
  return (
    <form method="get" action="/shop" className="sf-sort">
      {keep.map(([k, v], i) => <input key={`${k}-${i}`} type="hidden" name={k} value={v} />)}
      <label>
        Sort by:{" "}
        <select name="sort" defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
          <option value="relevance">Relevance</option>
          <option value="new">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="title">Title A–Z</option>
        </select>
      </label>
      <noscript><button>Apply</button></noscript>
    </form>
  );
}

/** Phone-only button that opens/closes the filter panel. */
export function FilterToggle({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className="sf-filterbtn"
      aria-expanded={open}
      onClick={() => {
        const el = document.getElementById("filters");
        el?.classList.toggle("open");
        setOpen(!open);
      }}
    >
      {open ? "Hide filters" : "Filters"}{count ? ` (${count})` : ""}
    </button>
  );
}