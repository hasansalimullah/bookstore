import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDelimited } from "../src/lib/csv.ts";
import { toSheetCsvUrl, isGoogleHost } from "../src/lib/sheets.ts";
import { parseRecords, planImport, columnFor, urlKey, type PlanDeps } from "../src/lib/import-plan.ts";
import { slugify, SLUG_RE } from "../src/lib/slug.ts";
import { parseMoneyToCents } from "../src/lib/shop.ts";

const deps: PlanDeps = {
  validateUrl: (u) => {
    try {
      const url = new URL(u);
      return url.protocol === "https:" && url.hostname.endsWith("supplier.test") ? { ok: true, url } : { ok: false, error: "Host not allowed" };
    } catch {
      return { ok: false, error: "Invalid URL" };
    }
  },
  slugify,
  slugRe: SLUG_RE,
  parsePrice: parseMoneyToCents,
  productId: (u) => u.pathname.split("/").filter(Boolean).pop() ?? null,
};

test("csv: quotes, commas, newlines, BOM, CRLF", () => {
  const t = '\uFEFFa,b,c\r\n1,"x, y","line1\nline2"\r\n"he said ""hi""",,3\r\n';
  assert.deepEqual(parseDelimited(t), [["a", "b", "c"], ["1", "x, y", "line1\nline2"], ['he said "hi"', "", "3"]]);
});

test("csv: tab-separated (copied from Google Sheets) and semicolons", () => {
  assert.deepEqual(parseDelimited("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseDelimited("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
});

test("csv: Arabic text and blank lines", () => {
  assert.deepEqual(parseDelimited("t,a\nمدارج السالكين,ابن القيم\n\n"), [["t", "a"], ["مدارج السالكين", "ابن القيم"]]);
});

test("sheets: link conversion", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdefg";
  assert.equal(toSheetCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`), `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`);
  assert.equal(toSheetCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=123`), `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=123`);
  assert.equal(toSheetCsvUrl("https://docs.google.com/spreadsheets/d/e/2PACX-abc_DEF/pub?output=html"), "https://docs.google.com/spreadsheets/d/e/2PACX-abc_DEF/pub?gid=0&single=true&output=csv");
  assert.equal(toSheetCsvUrl("https://evil.com/spreadsheets/d/abc"), null);
  assert.equal(toSheetCsvUrl("http://docs.google.com/spreadsheets/d/" + id), null);
  assert.equal(toSheetCsvUrl("nope"), null);
  assert.ok(isGoogleHost("doc-0s-abc.googleusercontent.com"));
  assert.ok(!isGoogleHost("google.com.evil.com"));
});

test("headers map from the user's real column names", () => {
  assert.equal(columnFor("Supplier product URL (private — never shown to customers)"), "sourceUrl");
  assert.equal(columnFor("Title (Arabic)"), "title");
  assert.equal(columnFor("Author"), "author");
  assert.equal(columnFor("Slug (optional, auto-made from the title)"), "slug");
  assert.equal(columnFor("Price (e.g. 24.99)"), "price");
  assert.equal(columnFor("Image URL (your own image)"), "imageUrl");
  assert.equal(columnFor("Description"), "description");
  assert.equal(columnFor("Notes"), null);
});

test("parseRecords: required columns and row numbers", () => {
  const bad = parseRecords("Author,Price\nx,1");
  assert.ok(bad.error?.includes("Missing required"));
  const ok = parseRecords("Title,Supplier product URL\nA,https://x.supplier.test/a\nB,https://x.supplier.test/b");
  assert.equal(ok.error, null);
  assert.deepEqual(ok.records.map((r) => r.row), [2, 3]);
});

const csv = (rows: string[]) => "Supplier product URL,Title,Author,Slug,Price,Image URL,Description\n" + rows.join("\n");

test("plan: creates, auto slugs, unique suffixes, warnings", () => {
  const { records } = parseRecords(csv([
    "https://a.supplier.test/p1,Zad Al Maad,Ibn Qayyim,,24.99,,",
    "https://a.supplier.test/p2,Zad Al Maad,Ibn Qayyim,,,,",
    "https://a.supplier.test/p3,Custom,,my-slug,10,https://img.test/x.jpg,desc",
  ]));
  const plan = planImport(records, [], deps);
  assert.deepEqual(plan.map((p) => [p.action, p.slug]), [["create", "zad-al-maad"], ["create", "zad-al-maad-2"], ["create", "my-slug"]]);
  assert.equal(plan[0].priceCents, 2499);
  assert.ok(plan[1].warnings.some((w) => w.includes("No price")));
  assert.ok(plan[1].warnings.some((w) => w.includes("was taken")));
});

test("plan: same supplier URL as an existing book → update, slug never changes", () => {
  const existing = [{ id: 7, slug: "old-slug", urlKey: urlKey(new URL("https://a.supplier.test/p1")) }];
  const { records } = parseRecords(csv(["https://A.supplier.test/p1/,New Title,,new-slug,30,,"]));
  const plan = planImport(records, existing, deps);
  assert.equal(plan[0].action, "update");
  assert.equal(plan[0].existingId, 7);
  assert.equal(plan[0].slug, "old-slug");
  assert.ok(plan[0].warnings.some((w) => w.includes("Slug kept")));
});

test("plan: errors — bad URL/host, missing title, bad price, bad image, duplicate in file, slug clash", () => {
  const existing = [{ id: 1, slug: "taken", urlKey: null }];
  const { records } = parseRecords(csv([
    "not a url,A,,,,,",
    "https://evil.com/x,B,,,,,",
    "https://a.supplier.test/1,,,,,,",
    "https://a.supplier.test/2,C,,,abc,,",
    "https://a.supplier.test/3,D,,,,ftp://x,",
    "https://a.supplier.test/4,E,,,,,",
    "https://a.supplier.test/4,F,,,,,",
    "https://a.supplier.test/5,G,,taken,,,",
    "https://a.supplier.test/6,H,,Bad Slug,,,",
  ]));
  const plan = planImport(records, existing, deps);
  assert.deepEqual(plan.map((p) => p.action), ["error", "error", "error", "error", "error", "create", "error", "error", "error"]);
  assert.ok(plan[6].error?.includes("row 7"));
  assert.ok(plan[7].error?.includes("already used"));
});

test("plan: mock URLs may repeat (seed/testing)", () => {
  const { records } = parseRecords(csv(["mock://available,A,,,,,", "mock://available,B,,,,,"]));
  const plan = planImport(records, [], { ...deps, validateUrl: (u) => ({ ok: true, url: new URL(u) }) });
  assert.deepEqual(plan.map((p) => p.action), ["create", "create"]);
});
