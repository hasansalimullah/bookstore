import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken, passwordMatches } from "../src/lib/session.ts";
import { slugify, SLUG_RE } from "../src/lib/slug.ts";

const SECRET = "a-very-long-test-secret-value-1234567890";

test("valid token verifies; tampered / expired / wrong-secret tokens do not", () => {
  const t = createSessionToken(SECRET, 1_000_000);
  assert.equal(verifySessionToken(SECRET, t, 1_000_500), true);
  assert.equal(verifySessionToken(SECRET, t, 1_000_000 + 9 * 3600_000), false);
  assert.equal(verifySessionToken("another-secret-another-secret-123", t, 1_000_500), false);
  const [exp, sig] = t.split(".");
  assert.equal(verifySessionToken(SECRET, `${Number(exp) + 999999}.${sig}`, 1_000_500), false);
  assert.equal(verifySessionToken(SECRET, "garbage", 1_000_500), false);
  assert.equal(verifySessionToken(SECRET, undefined, 1_000_500), false);
});

test("fails closed when the secret is missing or short", () => {
  const t = createSessionToken("short", 1);
  assert.equal(verifySessionToken("short", t, 2), false);
  assert.equal(verifySessionToken("", t, 2), false);
});

test("passwordMatches is exact and fails closed on weak/empty config", () => {
  assert.equal(passwordMatches("correct-horse-battery", "correct-horse-battery"), true);
  assert.equal(passwordMatches("correct-horse-battery", "wrong"), false);
  assert.equal(passwordMatches("", ""), false);
  assert.equal(passwordMatches("short", "short"), false);
});

test("slugify", () => {
  assert.equal(slugify("Madarij al-Salikeen!"), "madarij-al-salikeen");
  assert.match(slugify("مدارج السالكين"), /^book-[0-9a-f]{6}$/);
  assert.ok(SLUG_RE.test("madarij-al-salikeen"));
  assert.ok(!SLUG_RE.test("Bad Slug"));
});
