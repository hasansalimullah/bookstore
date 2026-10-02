"use client";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const BOOK_FIELD_DEFAULTS = {
  title: "", authorId: "", slug: "", price: "", imageUrl: "", description: "",
  titleAr: "", category: "", extraImages: "", edition: "", cover: "", printQuality: "", format: "", harakat: "",
};

export interface AuthorOption {
  id: number;
  name: string;
}

export default function BookFields({
  f, set, authors, onAuthorAdded,
}: {
  f: Record<string, any>;
  set: (k: any) => (e: any) => void;
  authors: AuthorOption[];
  onAuthorAdded?: (a: AuthorOption) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function onAuthor(e: any) {
    if (e.target.value !== "__new") return set("authorId")(e);
    const name = window.prompt("New author name:");
    if (!name?.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/authors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && d.author) {
      onAuthorAdded?.(d.author);
      set("authorId")({ target: { value: String(d.author.id) } });
    } else window.alert(d.error ?? "Could not add author");
  }

  const text = (k: string, label: string, dir: "ltr" | "rtl" | "auto" = "auto") => (
    <div className="ad-field"><label className="ad-label">{label}</label><input dir={dir} className="ad-input" value={f[k] ?? ""} onChange={set(k)} /></div>
  );

  return (
    <>
      <div className="ad-grid2">
        {text("title", "Title (Arabic)", "auto")}
        <div className="ad-field">
          <label className="ad-label">Author</label>
          <select className="ad-select" value={f.authorId ?? ""} onChange={onAuthor} disabled={busy}>
            <option value="">— No author —</option>
            {authors.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            <option value="__new">+ New author…</option>
          </select>
        </div>
        {text("slug", "Slug (optional, auto-made from the title)", "ltr")}
        {text("price", "Price (e.g. 24.99)", "ltr")}
        {text("imageUrl", "Image URL (your own image)", "ltr")}
        <div />
      </div>
      <div className="ad-field" style={{ marginBottom: 12 }}>
        <label className="ad-label">Description</label>
        <textarea dir="auto" className="ad-area" value={f.description ?? ""} onChange={set("description")} />
      </div>
      <details className="ad-more">
        <summary>More details (product page)</summary>
        <div style={{ marginTop: 12 }}>
          <div className="ad-grid2">
            {text("titleAr", "Second title (shown below the title — optional)", "auto")}
            {text("category", "Category (e.g. Fiqh & Ahkam > Fiqh Hanbali > Usul Madhhab)")}
            {text("edition", "Edition / publisher")}
            {text("cover", "Cover (e.g. Hard)")}
            {text("printQuality", "Print quality (e.g. Premium Quality)")}
            {text("format", "Format (e.g. 17x24cm)")}
            {text("harakat", "Harakat")}
            <div />
          </div>
          <div className="ad-field">
            <label className="ad-label">Extra image URLs (one per line — up to 2 are shown as thumbnails)</label>
            <textarea dir="ltr" className="ad-area" style={{ height: 80 }} value={f.extraImages ?? ""} onChange={set("extraImages")} />
          </div>
        </div>
      </details>
    </>
  );
}
