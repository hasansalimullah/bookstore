import { test } from "node:test";
import assert from "node:assert/strict";

// Configure BEFORE importing (config reads env at import time).
process.env.SOURCE_MODE = "mock";
const { fetchSourcePage, validateSourceUrl, extractSourceProductId } = await import("../src/lib/source-fetcher.ts");
const { evaluateFetch } = await import("../src/lib/evaluate.ts");

test("mock scenarios never touch the network and map to the right availability", async () => {
  const cases: [string, string][] = [
    ["mock://available", "available"],
    ["mock://out_of_stock", "out_of_stock"],
    ["mock://unknown", "unknown"],
    ["mock://timeout", "unknown"],
    ["mock://error", "unknown"],
  ];
  for (const [url, expected] of cases) {
    const f = await fetchSourcePage(url);
    assert.equal(f.simulated, true);
    assert.equal(evaluateFetch(f).availability, expected, url);
  }
});

test("timeout / error scenarios report the right error codes", async () => {
  assert.equal((await fetchSourcePage("mock://timeout")).errorCode, "timeout");
  assert.equal((await fetchSourcePage("mock://error")).errorCode, "network");
});

test("in mock mode a real-looking allowed URL is simulated, not fetched", async () => {
  const f = await fetchSourcePage("https://ibnaljawzi.com/xxxxxxxx");
  assert.equal(f.simulated, true);
});

test("URL validation: allowlist, scheme, garbage", () => {
  assert.equal(validateSourceUrl("https://ibnaljawzi.com/abc").ok, true);
  assert.equal(validateSourceUrl("https://www.ibnaljawzi.com/abc").ok, true);
  assert.equal(validateSourceUrl("http://ibnaljawzi.com/abc").ok, false);
  assert.equal(validateSourceUrl("https://evil.example.com/abc").ok, false);
  assert.equal(validateSourceUrl("https://ibnaljawzi.com.evil.example/abc").ok, false);
  assert.equal(validateSourceUrl("http://169.254.169.254/latest/meta-data").ok, false);
  assert.equal(validateSourceUrl("not a url").ok, false);
});

test("extractSourceProductId", () => {
  assert.equal(extractSourceProductId(new URL("https://ibnaljawzi.com/xxxxxxxx")), "xxxxxxxx");
  assert.equal(extractSourceProductId(new URL("https://ibnaljawzi.com/")), null);
});
