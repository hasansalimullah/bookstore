// Dependency-free availability parser. Pure functions: no network, no DB.
// Uses relative .ts imports elsewhere so it runs under plain Node (type stripping) AND Next.js.

export type ParsedStatus = "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";

export type UnknownReason =
  | "empty_html"
  | "container_not_found"
  | "strong_not_found"
  | "empty_text"
  | "unrecognized_text";

export interface ParseResult {
  status: ParsedStatus;
  /** Was the .product-availablity container found? */
  containerFound: boolean;
  /** Was a <strong> found inside it? (i.e. did `.product-availablity strong` match) */
  selectorFound: boolean;
  /** Text of the <strong>, whitespace-collapsed, as on the page */
  detectedText: string | null;
  /** Text after Arabic normalization (what the matcher actually saw) */
  normalizedText: string | null;
  reason: UnknownReason | null;
  /** How many .product-availablity containers exist (>1 = ambiguous, worth a look) */
  containerCount: number;
  /** Cross-check only: schema.org availability from JSON-LD. Never used to decide status. */
  jsonLdAvailability: string | null;
}

const CONTAINER_CLASS = "product-availablity"; // (sic) — the source site's spelling
const OPEN_DIV = /<div\b[^>]*>/gi;

const AVAILABLE_TEXTS = new Set(["متوفر", "متوفر حاليا", "متوفر الان"]);
const OUT_OF_STOCK_PREFIX = "غير متوفر"; // covers "غير متوفر" and "غير متوفر حاليا"

/** Normalize Arabic text so trivial variations (harakat, alef forms, bidi marks) don't break matching. */
export function normalizeArabic(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // tashkeel / harakat / small marks
    .replace(/\u0640/g, "") // tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "") // zero-width + bidi marks
    .replace(/\s+/g, " ")
    .trim();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function hasClass(tag: string, cls: string): boolean {
  const m = tag.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  if (!m) return false;
  return (m[1] ?? m[2] ?? "").split(/\s+/).includes(cls);
}

/** Remove comments/<script>/<style> so we never match inside them. */
function cleanHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "");
}

/** Inner HTML of every <div class~="product-availablity">, honoring nested divs. */
function findContainers(html: string): string[] {
  const out: string[] = [];
  OPEN_DIV.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = OPEN_DIV.exec(html))) {
    if (!hasClass(m[0], CONTAINER_CLASS)) continue;
    const start = m.index + m[0].length;
    let depth = 1;
    const tag = /<(\/?)div\b[^>]*>/gi;
    tag.lastIndex = start;
    let t: RegExpExecArray | null;
    let end = -1;
    while ((t = tag.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    // Unclosed container: take a bounded slice so we don't swallow the whole page.
    out.push(html.slice(start, end === -1 ? Math.min(html.length, start + 2000) : end));
  }
  return out;
}

function findAvailability(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findAvailability(n);
      if (r) return r;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj.availability === "string") return obj.availability.replace(/^https?:\/\/schema\.org\//, "");
  for (const v of Object.values(obj)) {
    const r = findAvailability(v);
    if (r) return r;
  }
  return null;
}

function extractJsonLdAvailability(rawHtml: string): string | null {
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawHtml))) {
    try {
      const found = findAvailability(JSON.parse(m[1]));
      if (found) return found;
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return null;
}

export function parseAvailability(rawHtml: string | null | undefined): ParseResult {
  const base: ParseResult = {
    status: "UNKNOWN",
    containerFound: false,
    selectorFound: false,
    detectedText: null,
    normalizedText: null,
    reason: null,
    containerCount: 0,
    jsonLdAvailability: null,
  };

  if (typeof rawHtml !== "string" || !rawHtml.trim()) return { ...base, reason: "empty_html" };

  base.jsonLdAvailability = extractJsonLdAvailability(rawHtml);

  const containers = findContainers(cleanHtml(rawHtml));
  base.containerCount = containers.length;
  if (containers.length === 0) return { ...base, reason: "container_not_found" };
  base.containerFound = true;

  // First container, equivalent to `.product-availablity strong`.
  const strong = containers[0].match(/<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i);
  if (!strong) return { ...base, reason: "strong_not_found" };
  base.selectorFound = true;

  const text = stripTags(strong[1]);
  base.detectedText = text || null;
  if (!text) return { ...base, reason: "empty_text" };

  const norm = normalizeArabic(text);
  base.normalizedText = norm;

  // OUT_OF_STOCK first: "غير متوفر" contains "متوفر".
  if (norm === OUT_OF_STOCK_PREFIX || norm.startsWith(OUT_OF_STOCK_PREFIX + " ")) {
    return { ...base, status: "OUT_OF_STOCK" };
  }
  if (AVAILABLE_TEXTS.has(norm)) return { ...base, status: "AVAILABLE" };

  // Anything else is NOT assumed to be out of stock.
  return { ...base, reason: "unrecognized_text" };
}

/** Internal status → customer-facing DB value */
export function toAvailability(s: ParsedStatus): "available" | "out_of_stock" | "unknown" {
  return s === "AVAILABLE" ? "available" : s === "OUT_OF_STOCK" ? "out_of_stock" : "unknown";
}
