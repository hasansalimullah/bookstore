import { randomBytes } from "node:crypto";

const AR: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "a", ء: "", ئ: "", ؤ: "", ب: "b", ت: "t", ث: "th", ج: "j",
  ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d",
  ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "a", و: "w", ي: "y", ى: "a",
};

/** Works with English or Arabic titles. Arabic is transliterated: "مدارج السالكين" → "mdarj-alsalkyn" */
export function slugify(input: string): string {
  const latin = input
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // remove Arabic diacritics
    .split("")
    .map((c) => (c in AR ? AR[c] : c))
    .join("");
  const s = latin
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || `book-${randomBytes(3).toString("hex")}`;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;