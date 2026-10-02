// Pure import logic: CSV text → validated, de-duplicated plan (create / update / error). No DB, no network.
import { parseDelimited } from "./csv.ts";

export type Field =
  | "sourceUrl" | "title" | "titleAr" | "author" | "slug" | "price" | "imageUrl" | "imageUrl2" | "imageUrl3"
  | "description" | "category" | "edition" | "cover" | "printQuality" | "format" | "harakat";

export interface RawRecord {
  row: number; // spreadsheet row number (header = 1)
  values: Partial<Record<Field, string>>;
}

export interface ExistingBook {
  id: number;
  slug: string;
  urlKey: string | null; // normalized source URL of the book, if any
}

export interface PlanDeps {
  validateUrl: (u: string) => { ok: true; url: URL } | { ok: false; error: string };
  slugify: (title: string) => string;
  slugRe: RegExp;
  parsePrice: (s: string) => number | null;
  productId: (u: URL) => string | null;
}

export interface PlannedRow {
  row: number;
  action: "create" | "update" | "error";
  title: string;
  slug: string | null;
  error: string | null;
  warnings: string[];
  existingId: number | null;
  // --- private data (never sent to the browser) ---
  sourceUrl?: string;
  sourceProductId?: string | null;
  titleAr?: string | null;
  author?: string | null;
  description?: string | null;
  category?: string | null;
  edition?: string | null;
  cover?: string | null;
  printQuality?: string | null;
  format?: string | null;
  harakat?: string | null;
  imageUrl?: string | null;
  /** extra image URLs joined by newlines ("" if none) */
  extraImages?: string;
  priceCents?: number | null;
}

export const MAX_ROWS = 500;

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");

export function columnFor(header: string): Field | null {
  const n = norm(header);
  if (!n) return null;
  if (/^(image|photo|cover?image|picture|img)/.test(n)) {
    const m = n.match(/([23])$/);
    return m ? (`imageUrl${m[1]}` as Field) : "imageUrl";
  }
  if (/^(supplier|source|producturl|ibnaljawzi)/.test(n) || n === "url" || n === "link") return "sourceUrl";
  if (/^(titlearabic|arabictitle|titlear|arabicname|namearabic)/.test(n) || /^title.*arabic/.test(n)) return "titleAr";
  if (/^(title|bookname|booktitle|titleenglish|englishtitle)/.test(n) || n === "name" || n === "book") return "title";
  if (/^(author|writer)/.test(n)) return "author";
  if (/^slug/.test(n)) return "slug";
  if (/^(price|cost)/.test(n)) return "price";
  if (/^(description|desc|details|about)/.test(n)) return "description";
  if (/^(category|categories|section)/.test(n)) return "category";
  if (/^(edition|publisher)/.test(n)) return "edition";
  if (/^cover/.test(n)) return "cover";
  if (/^(printquality|print)/.test(n)) return "printQuality";
  if (/^(format|size|dimensions)/.test(n)) return "format";
  if (/^harakat/.test(n)) return "harakat";
  return null;
}

export function parseRecords(text: string): { records: RawRecord[]; error: string | null; headers: string[] } {
  const table = parseDelimited(text);
  if (table.length === 0) return { records: [], error: "The sheet is empty.", headers: [] };
  const headers = table[0].map((h) => h.trim());
  const cols = new Map<number, Field>();
  const seen = new Set<Field>();
  headers.forEach((h, i) => {
    const f = columnFor(h);
    if (f && !seen.has(f)) {
      cols.set(i, f);
      seen.add(f);
    }
  });
  const missing = (["sourceUrl"] as Field[]).filter((f) => !seen.has(f));
  if (!seen.has("title") && !seen.has("titleAr")) missing.push("title");
  if (missing.length) {
    const label = { sourceUrl: "Supplier product URL", title: "Title" } as Record<string, string>;
    return { records: [], headers, error: `Missing required column(s): ${missing.map((m) => label[m]).join(", ")}. Found headers: ${headers.filter(Boolean).join(" | ") || "(none)"}` };
  }
  const records: RawRecord[] = table.slice(1).map((r, idx) => {
    const values: Partial<Record<Field, string>> = {};
    cols.forEach((field, i) => {
      values[field] = (r[i] ?? "").trim();
    });
    return { row: idx + 2, values };
  });
  return { records, error: null, headers };
}

export function urlKey(u: URL): string | null {
  if (u.protocol === "mock:") return null; // mock links are intentionally reusable
  return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
}

export function planImport(records: RawRecord[], existing: ExistingBook[], deps: PlanDeps): PlannedRow[] {
  const byUrl = new Map<string, ExistingBook>();
  const slugOwner = new Map<string, ExistingBook>();
  const taken = new Set<string>();
  for (const b of existing) {
    if (b.urlKey) byUrl.set(b.urlKey, b);
    slugOwner.set(b.slug, b);
    taken.add(b.slug);
  }
  const seenUrlInFile = new Map<string, number>();
  const seenExistingInFile = new Map<number, number>();

  return records.map((rec): PlannedRow => {
    const v = rec.values;
    const title = (v.title || v.titleAr || "").slice(0, 300);
    const fail = (error: string): PlannedRow => ({ row: rec.row, action: "error", title, slug: null, error, warnings: [], existingId: null });

    if (!title) return fail("Title is empty");
    const urlRaw = v.sourceUrl ?? "";
    if (!urlRaw) return fail("Supplier product URL is empty");
    const vu = deps.validateUrl(urlRaw);
    if (!vu.ok) return fail(`Supplier URL: ${vu.error}`);

    let priceCents: number | null = null;
    if (v.price) {
      priceCents = deps.parsePrice(v.price);
      if (priceCents === null) return fail(`Invalid price "${v.price}" (use a number like 24.99)`);
    }
    const imgs = [v.imageUrl, v.imageUrl2, v.imageUrl3].map((x) => (x ?? "").trim());
    if (imgs.some((x) => x && !/^https:\/\/\S+$/i.test(x))) return fail("Image URLs must start with https://");

    const warnings: string[] = [];
    const key = urlKey(vu.url);
    if (key) {
      const dupRow = seenUrlInFile.get(key);
      if (dupRow) return fail(`Same supplier URL already used in row ${dupRow}`);
      seenUrlInFile.set(key, rec.row);
    }

    const common = {
      row: rec.row,
      title,
      error: null,
      sourceUrl: vu.url.toString(),
      sourceProductId: deps.productId(vu.url),
      titleAr: v.titleAr ? v.titleAr.slice(0, 300) : null,
      author: v.author ? v.author.slice(0, 200) : null,
      description: v.description ? v.description.slice(0, 5000) : null,
      category: v.category ? v.category.slice(0, 300) : null,
      edition: v.edition ? v.edition.slice(0, 300) : null,
      cover: v.cover ? v.cover.slice(0, 300) : null,
      printQuality: v.printQuality ? v.printQuality.slice(0, 300) : null,
      format: v.format ? v.format.slice(0, 300) : null,
      harakat: v.harakat ? v.harakat.slice(0, 300) : null,
      imageUrl: imgs[0] || null,
      extraImages: [imgs[1], imgs[2]].filter(Boolean).join("\n"),
      priceCents,
    };

    // 1) Same supplier URL as an existing book → update that book (its slug never changes).
    const hit = key ? byUrl.get(key) : undefined;
    if (hit) {
      if (seenExistingInFile.has(hit.id)) return fail(`Matches the same existing book as row ${seenExistingInFile.get(hit.id)}`);
      seenExistingInFile.set(hit.id, rec.row);
      const wanted = (v.slug ?? "").toLowerCase();
      if (wanted && wanted !== hit.slug) warnings.push(`Slug kept as "${hit.slug}" (existing books keep their URL)`);
      return { ...common, action: "update", slug: hit.slug, existingId: hit.id, warnings };
    }

    // 2) New book. Explicit slug must be valid and free; otherwise auto-make a unique one.
    let slug: string;
    const wanted = (v.slug ?? "").toLowerCase();
    if (wanted) {
      if (!deps.slugRe.test(wanted)) return fail(`Invalid slug "${v.slug}" (lowercase letters, numbers, hyphens)`);
      if (taken.has(wanted)) return fail(`Slug "${wanted}" is already used by another book`);
      slug = wanted;
    } else {
      const base = deps.slugify(title);
      slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      if (slug !== base) warnings.push(`Slug "${base}" was taken → using "${slug}"`);
    }
    taken.add(slug);
    if (!priceCents && priceCents !== 0) warnings.push("No price → can't be ordered until you add one");
    return { ...common, action: "create", slug, existingId: null, warnings };
  });
}

export function summarize(plan: PlannedRow[]) {
  return {
    create: plan.filter((p) => p.action === "create").length,
    update: plan.filter((p) => p.action === "update").length,
    error: plan.filter((p) => p.action === "error").length,
  };
}
