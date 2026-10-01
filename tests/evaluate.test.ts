import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateFetch, nextDelayMs, effectiveAvailability, needsLiveCheck } from "../src/lib/evaluate.ts";
import type { FetchResult } from "../src/lib/source-fetcher.ts";
import * as F from "../src/lib/fixtures.ts";

const ok = (html: string): FetchResult => ({ ok: true, httpStatus: 200, html, errorCode: null, errorMessage: null, durationMs: 5, retryAfterSec: null, simulated: true });
const fail = (code: FetchResult["errorCode"], msg = "x", status: number | null = null): FetchResult => ({ ok: false, httpStatus: status, html: null, errorCode: code, errorMessage: msg, durationMs: 5, retryAfterSec: null, simulated: true });

test("available page → available", () => {
  const e = evaluateFetch(ok(F.FIXTURE_AVAILABLE));
  assert.deepEqual([e.outcome, e.availability, e.parsedStatus], ["ok", "available", "AVAILABLE"]);
});

test("out of stock page → out_of_stock", () => {
  const e = evaluateFetch(ok(F.FIXTURE_OUT_OF_STOCK));
  assert.deepEqual([e.outcome, e.availability], ["ok", "out_of_stock"]);
});

test("network timeout → unknown/error, NOT out_of_stock", () => {
  const e = evaluateFetch(fail("timeout"));
  assert.deepEqual([e.outcome, e.availability, e.reason], ["error", "unknown", "timeout"]);
});

test("network error / HTTP 500 / 403 block / 429 → unknown", () => {
  for (const c of ["network", "http_error", "blocked", "rate_limited"] as const) {
    assert.equal(evaluateFetch(fail(c)).availability, "unknown");
  }
});

test("HTML changed (element missing) → unknown/error", () => {
  const e = evaluateFetch(ok(F.FIXTURE_MISSING_ELEMENT));
  assert.deepEqual([e.outcome, e.availability, e.reason], ["error", "unknown", "container_not_found"]);
});

test("HTML changed (strong missing) → unknown/error", () => {
  assert.equal(evaluateFetch(ok(F.FIXTURE_MISSING_STRONG)).availability, "unknown");
});

test("unexpected HTML → unknown", () => {
  assert.equal(evaluateFetch(ok(F.FIXTURE_UNEXPECTED)).availability, "unknown");
});

test("ok=true but html null → unknown (defensive)", () => {
  assert.equal(evaluateFetch({ ...ok(""), html: null }).availability, "unknown");
});

test("nextDelayMs: interval + jitter, backoff on failures, capped, honors Retry-After", () => {
  const min = nextDelayMs({ intervalMinutes: 10, consecutiveFailures: 0, rand: () => 0 });
  const max = nextDelayMs({ intervalMinutes: 10, consecutiveFailures: 0, rand: () => 1 });
  assert.equal(min, 600_000);
  assert.equal(max, 720_000);
  assert.equal(nextDelayMs({ intervalMinutes: 10, consecutiveFailures: 2, rand: () => 0 }), 2_400_000);
  assert.equal(nextDelayMs({ intervalMinutes: 10, consecutiveFailures: 50, rand: () => 0 }), 7_200_000);
  assert.equal(nextDelayMs({ intervalMinutes: 10, consecutiveFailures: 0, retryAfterSec: 1800, rand: () => 0 }), 1_800_000);
});

test("effectiveAvailability: stale successes degrade to unknown", () => {
  const now = new Date("2026-09-29T12:00:00Z");
  assert.equal(effectiveAvailability("available", "2026-09-29T11:30:00Z", 60, now), "available");
  assert.equal(effectiveAvailability("available", "2026-09-29T10:00:00Z", 60, now), "unknown");
  assert.equal(effectiveAvailability("out_of_stock", null, 60, now), "unknown");
  assert.equal(effectiveAvailability("unknown", "2026-09-29T11:59:00Z", 60, now), "unknown");
});

test("needsLiveCheck: skip when the scheduler checked recently", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  assert.equal(needsLiveCheck("2026-09-30T11:59:30Z", 120, now), false);
  assert.equal(needsLiveCheck("2026-09-30T11:55:00Z", 120, now), true);
  assert.equal(needsLiveCheck(null, 120, now), true);
});
