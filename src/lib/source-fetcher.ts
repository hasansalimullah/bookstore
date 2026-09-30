// Fetches the source product page (server-side only). Supports a mock mode so development
// and tests never touch the real site.
import { config } from "./config.ts";
import { SCENARIO_HTML, type ScenarioName } from "./fixtures.ts";

export type FetchErrorCode =
  | "timeout"
  | "network"
  | "http_error"
  | "blocked"
  | "rate_limited"
  | "redirected_off_host"
  | "invalid_url"
  | "too_large"
  | "not_html";

export interface FetchResult {
  ok: boolean;
  httpStatus: number | null;
  html: string | null;
  errorCode: FetchErrorCode | null;
  errorMessage: string | null;
  durationMs: number;
  /** Seconds from a Retry-After header, if any */
  retryAfterSec: number | null;
  simulated: boolean;
}

const MAX_BYTES = 2_000_000;

export function validateSourceUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: "رابط غير صالح" };
  }
  if (url.protocol === "mock:") {
    return config.sourceMode === "mock" ? { ok: true, url } : { ok: false, error: "mock:// URLs are only allowed in SOURCE_MODE=mock" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Only https:// URLs are allowed" };
  if (!config.allowedSourceHosts.includes(url.hostname.toLowerCase())) {
    return { ok: false, error: `Host not allowed (allowed: ${config.allowedSourceHosts.join(", ")})` };
  }
  return { ok: true, url };
}

/** Last non-empty path segment, kept as an informational id. */
export function extractSourceProductId(url: URL): string | null {
  const segs = url.pathname.split("/").filter(Boolean);
  return segs.length ? decodeURIComponent(segs[segs.length - 1]).slice(0, 200) : null;
}

function result(partial: Partial<FetchResult>, start: number): FetchResult {
  return {
    ok: false,
    httpStatus: null,
    html: null,
    errorCode: null,
    errorMessage: null,
    retryAfterSec: null,
    simulated: false,
    ...partial,
    durationMs: Date.now() - start,
  };
}

// ---- polite per-host rate limiting (in-process) ----
const nextSlot = new Map<string, number>();
async function politeWait(host: string) {
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, slot + config.checkMinDelayMs);
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

function mockFetch(url: URL, start: number): FetchResult {
  // mock://available | mock://out_of_stock | mock://unknown | mock://timeout | mock://error
  // In mock mode, real https URLs are simulated as "available" — no request is ever made.
  const scenario = (url.protocol === "mock:" ? url.hostname || url.pathname.replace(/^\/+/, "") : "available") as ScenarioName;
  if (scenario === "timeout") {
    return result({ simulated: true, errorCode: "timeout", errorMessage: "Simulated timeout" }, start);
  }
  if (scenario === "error") {
    return result({ simulated: true, errorCode: "network", errorMessage: "Simulated network error" }, start);
  }
  const html = SCENARIO_HTML[scenario as keyof typeof SCENARIO_HTML] ?? SCENARIO_HTML.available;
  return result({ simulated: true, ok: true, httpStatus: 200, html }, start);
}

export async function fetchSourcePage(rawUrl: string): Promise<FetchResult> {
  const start = Date.now();
  const v = validateSourceUrl(rawUrl);
  if (!v.ok) return result({ errorCode: "invalid_url", errorMessage: v.error }, start);

  if (config.sourceMode === "mock") return mockFetch(v.url, start);

  await politeWait(v.url.hostname);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.checkTimeoutMs);
  try {
    const res = await fetch(v.url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": config.userAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ar,en;q=0.8",
      },
      cache: "no-store",
    });

    // After redirects, make sure we're still on an allowed host.
    const finalHost = new URL(res.url || v.url.toString()).hostname.toLowerCase();
    if (!config.allowedSourceHosts.includes(finalHost)) {
      return result({ httpStatus: res.status, errorCode: "redirected_off_host", errorMessage: "Redirected to a disallowed host" }, start);
    }

    const ra = Number(res.headers.get("retry-after"));
    const retryAfterSec = Number.isFinite(ra) && ra > 0 ? ra : null;

    if (res.status === 429) {
      return result({ httpStatus: 429, errorCode: "rate_limited", errorMessage: "HTTP 429 (rate limited)", retryAfterSec }, start);
    }
    // We deliberately do NOT try to bypass blocks/challenges: report and back off.
    if (res.status === 403 || res.status === 503) {
      return result({ httpStatus: res.status, errorCode: "blocked", errorMessage: `HTTP ${res.status} (blocked or challenged)`, retryAfterSec }, start);
    }
    if (!res.ok) {
      return result({ httpStatus: res.status, errorCode: "http_error", errorMessage: `HTTP ${res.status}` }, start);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (ct && !/html|xml/i.test(ct)) {
      return result({ httpStatus: res.status, errorCode: "not_html", errorMessage: `Unexpected content-type: ${ct}` }, start);
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return result({ httpStatus: res.status, errorCode: "too_large", errorMessage: "Response too large" }, start);
    }
    return result({ ok: true, httpStatus: res.status, html: new TextDecoder("utf-8").decode(buf) }, start);
  } catch (err) {
    const aborted = err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
    return result(
      {
        errorCode: aborted ? "timeout" : "network",
        errorMessage: aborted ? `Timed out after ${config.checkTimeoutMs}ms` : err instanceof Error ? err.message : "Network error",
      },
      start,
    );
  } finally {
    clearTimeout(timer);
  }
}
