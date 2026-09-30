import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAvailability, normalizeArabic } from "../src/lib/parser.ts";
import * as F from "../src/lib/fixtures.ts";

const wrap = (text: string) => `<div class="product-availablity"><strong>${text}</strong></div>`;

test('"متوفر" → AVAILABLE (exact HTML from the source)', () => {
  const r = parseAvailability(F.FIXTURE_AVAILABLE);
  assert.equal(r.status, "AVAILABLE");
  assert.equal(r.selectorFound, true);
  assert.equal(r.detectedText, "متوفر");
});

test('"غير متوفر" → OUT_OF_STOCK (not mistaken for متوفر)', () => {
  const r = parseAvailability(F.FIXTURE_OUT_OF_STOCK);
  assert.equal(r.status, "OUT_OF_STOCK");
  assert.equal(r.detectedText, "غير متوفر");
});

test('"غير متوفر حاليًا" (with tanween) → OUT_OF_STOCK', () => {
  assert.equal(parseAvailability(F.FIXTURE_OUT_OF_STOCK_CURRENTLY).status, "OUT_OF_STOCK");
  assert.equal(parseAvailability(wrap("غير متوفر حاليا")).status, "OUT_OF_STOCK");
});

test("missing .product-availablity element → UNKNOWN", () => {
  const r = parseAvailability(F.FIXTURE_MISSING_ELEMENT);
  assert.equal(r.status, "UNKNOWN");
  assert.equal(r.reason, "container_not_found");
  assert.equal(r.containerFound, false);
});

test("missing <strong> element → UNKNOWN", () => {
  const r = parseAvailability(F.FIXTURE_MISSING_STRONG);
  assert.equal(r.status, "UNKNOWN");
  assert.equal(r.reason, "strong_not_found");
  assert.equal(r.containerFound, true);
  assert.equal(r.selectorFound, false);
});

test("unexpected HTML (challenge page) → UNKNOWN", () => {
  assert.equal(parseAvailability(F.FIXTURE_UNEXPECTED).status, "UNKNOWN");
});

test("empty / null / garbage input → UNKNOWN, never throws", () => {
  for (const input of ["", "   ", null, undefined, "<<<>>>", "<div class=", "\u0000\u0001"]) {
    assert.equal(parseAvailability(input as string).status, "UNKNOWN");
  }
});

test("unrecognized text → UNKNOWN (never guess out of stock)", () => {
  const r = parseAvailability(wrap("قريبًا"));
  assert.equal(r.status, "UNKNOWN");
  assert.equal(r.reason, "unrecognized_text");
});

test("empty <strong> → UNKNOWN", () => {
  assert.equal(parseAvailability(wrap("  ")).reason, "empty_text");
});

test("whitespace, entities, nested tags and bidi marks are tolerated", () => {
  assert.equal(parseAvailability(wrap("\n  متوفر \n")).status, "AVAILABLE");
  assert.equal(parseAvailability(wrap("&nbsp;متوفر&nbsp;")).status, "AVAILABLE");
  assert.equal(parseAvailability(wrap("<span>متوفر</span>")).status, "AVAILABLE");
  assert.equal(parseAvailability(wrap("\u200Fمتوفر\u200F")).status, "AVAILABLE");
});

test("class matching is exact-token, not substring", () => {
  const html = `<div class="my-product-availablity-x"><strong>متوفر</strong></div>`;
  assert.equal(parseAvailability(html).status, "UNKNOWN");
});

test("nested divs inside the container are handled", () => {
  const html = `<div class="product-availablity"><div class="inner"><span></span></div><strong>متوفر</strong></div><div><strong>غير متوفر</strong></div>`;
  assert.equal(parseAvailability(html).status, "AVAILABLE");
});

test("text inside <script>/<style>/comments is ignored", () => {
  const html = `<script>var x='<div class="product-availablity"><strong>متوفر</strong></div>'</script><!-- <div class="product-availablity"><strong>متوفر</strong></div> -->`;
  assert.equal(parseAvailability(html).status, "UNKNOWN");
});

test("multiple containers: first wins, count is reported", () => {
  const r = parseAvailability(wrap("غير متوفر") + wrap("متوفر"));
  assert.equal(r.status, "OUT_OF_STOCK");
  assert.equal(r.containerCount, 2);
});

test("JSON-LD availability is captured for cross-checking only", () => {
  const html =
    `<script type="application/ld+json">{"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}</script>` +
    wrap("غير متوفر");
  const r = parseAvailability(html);
  assert.equal(r.status, "OUT_OF_STOCK"); // decision comes from the selector only
  assert.equal(r.jsonLdAvailability, "InStock");
});

test("normalizeArabic", () => {
  assert.equal(normalizeArabic("غَيْرُ  مُتَوَفِّرٍ"), "غير متوفر");
  assert.equal(normalizeArabic("حاليًّا"), "حاليا");
});
