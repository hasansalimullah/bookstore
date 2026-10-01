// Pure decision logic: fetch result + HTML → what to store. No DB, no network. Unit-tested.
import { parseAvailability, toAvailability, type ParseResult, type ParsedStatus } from "./parser.ts";
import type { FetchResult } from "./source-fetcher.ts";

export interface Evaluation {
  outcome: "ok" | "error";
  parsedStatus: ParsedStatus;
  availability: "available" | "out_of_stock" | "unknown";
  reason: string | null;
  errorMessage: string | null;
  parse: ParseResult | null;
}

/**
 * Rules:
 *  - Only a successful fetch + a recognized status yields available / out_of_stock.
 *  - Anything else (timeout, HTTP error, block, missing selector, odd text) → unknown.
 *  - We NEVER infer out_of_stock from a failure.
 */
export function evaluateFetch(f: FetchResult): Evaluation {
  if (!f.ok || f.html == null) {
    return {
      outcome: "error",
      parsedStatus: "UNKNOWN",
      availability: "unknown",
      reason: f.errorCode ?? "fetch_failed",
      errorMessage: f.errorMessage ?? "Fetch failed",
      parse: null,
    };
  }
  const parse = parseAvailability(f.html);
  if (parse.status === "UNKNOWN") {
    return {
      outcome: "error",
      parsedStatus: "UNKNOWN",
      availability: "unknown",
      reason: parse.reason ?? "parse_failed",
      errorMessage: `Parse failed: ${parse.reason ?? "unknown"}`,
      parse,
    };
  }
  return {
    outcome: "ok",
    parsedStatus: parse.status,
    availability: toAvailability(parse.status),
    reason: null,
    errorMessage: null,
    parse,
  };
}

/** Delay (ms) until the next scheduled check, with jitter and failure backoff. */
export function nextDelayMs(opts: {
  intervalMinutes: number;
  consecutiveFailures: number;
  retryAfterSec?: number | null;
  rand?: () => number;
}): number {
  const rand = opts.rand ?? Math.random;
  const base = opts.intervalMinutes * 60_000;
  const backoff = opts.consecutiveFailures > 0 ? Math.min(2 ** Math.min(opts.consecutiveFailures, 4), 12) : 1;
  let delay = Math.min(base * backoff, 120 * 60_000);
  if (opts.retryAfterSec) delay = Math.max(delay, opts.retryAfterSec * 1000);
  return Math.round(delay * (1 + rand() * 0.2)); // +0–20% jitter so checks spread out
}

/** Public-facing availability with stale-data protection. */
export function effectiveAvailability(
  stored: "available" | "out_of_stock" | "unknown",
  lastSuccessAt: Date | string | null,
  staleAfterMinutes: number,
  now: Date = new Date(),
): "available" | "out_of_stock" | "unknown" {
  if (stored === "unknown" || !lastSuccessAt) return "unknown";
  const age = now.getTime() - new Date(lastSuccessAt).getTime();
  return age > staleAfterMinutes * 60_000 ? "unknown" : stored;
}

/** Should we re-check this book live right before an order? (Skip when the scheduler already checked it recently.) */
export function needsLiveCheck(lastChecked: Date | string | null, freshSeconds: number, now: Date = new Date()): boolean {
  if (!lastChecked) return true;
  return now.getTime() - new Date(lastChecked).getTime() > freshSeconds * 1000;
}
