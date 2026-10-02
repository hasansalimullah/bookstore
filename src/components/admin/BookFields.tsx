"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const inp = "w-full rounded border border-stone-300 px-2 py-1.5";

export const BOOK_FIELD_DEFAULTS = {
  title: "", titleAr: "", author: "", slug: "", price: "", category: "", imageUrl: "", extraImages: "",
  edition: "", cover: "", printQuality: "", format: "", harakat: "", description: "",
};

export default function BookFields({ f, set }: { f: Record<string, any>; set: (k: any) => (e: any) => void }) {
  const text = (k: string, label: string, dir: "ltr" | "rtl" | "auto" = "auto") => (
    <label key={k} className="text-sm">{label}<input dir={dir} className={inp} value={f[k] ?? ""} onChange={set(k)} /></label>
  );
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {text("title", "Title (English / main title)")}
        {text("titleAr", "Title (Arabic)", "rtl")}
        {text("author", "Author")}
        {text("slug", "Slug (optional, auto-made from the title)", "ltr")}
        {text("price", "Price (e.g. 24.99)", "ltr")}
        {text("category", "Category (e.g. Fiqh & Ahkam > Fiqh Hanbali > Usul Madhhab)")}
        {text("imageUrl", "Main image URL (your own image)", "ltr")}
        {text("edition", "Edition / publisher")}
        {text("cover", "Cover (e.g. Hard)")}
        {text("printQuality", "Print quality (e.g. Premium Quality)")}
        {text("format", "Format (e.g. 17x24cm)")}
        {text("harakat", "Harakat")}
      </div>
      <label className="block text-sm">Extra image URLs (one per line, up to 3 are shown as thumbnails)
        <textarea dir="ltr" rows={3} className={inp} value={f.extraImages ?? ""} onChange={set("extraImages")} />
      </label>
      <label className="block text-sm">Description
        <textarea dir="auto" rows={4} className={inp} value={f.description ?? ""} onChange={set("description")} />
      </label>
    </>
  );
}
