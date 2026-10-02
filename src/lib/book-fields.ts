// Reads the optional storefront fields from an untrusted admin request body.
export const TEXT_FIELDS = ["titleAr", "author", "description", "category", "edition", "cover", "printQuality", "format", "harakat", "imageUrl"] as const;
const MAX: Record<string, number> = { description: 5000, category: 300, imageUrl: 1000 };

export function readTextFields(b: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of TEXT_FIELDS) {
    if (typeof b[k] === "string") out[k] = (b[k] as string).trim().slice(0, MAX[k] ?? 300);
  }
  return out;
}

/** Newline/comma separated https URLs → array (max 8). Returns null if any entry is not https. */
export function readExtraImages(v: unknown): string[] | null | undefined {
  if (v === undefined) return undefined;
  const list = (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[\n,]+/) : [])
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.some((u) => !/^https:\/\/\S+$/i.test(u))) return null;
  return list.slice(0, 8);
}
