import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseMoneyToCents, formatMoney, normalizeCart, computeTotals, validateCustomer } from "../src/lib/shop.ts";
import { encodeForm, verifyStripeSignature } from "../src/lib/stripe.ts";

test("parseMoneyToCents", () => {
  assert.equal(parseMoneyToCents("12.5"), 1250);
  assert.equal(parseMoneyToCents("$1,200.99"), 120099);
  assert.equal(parseMoneyToCents("0"), 0);
  assert.equal(parseMoneyToCents(""), null);
  assert.equal(parseMoneyToCents("-5"), null);
  assert.equal(parseMoneyToCents("12.345"), null);
  assert.equal(parseMoneyToCents("abc"), null);
  assert.equal(parseMoneyToCents(undefined), null);
});

test("formatMoney", () => assert.equal(formatMoney(1250, "usd"), "$12.50"));

test("normalizeCart: merges, clamps, drops junk", () => {
  const c = normalizeCart([{ bookId: 1, qty: 2 }, { bookId: 1, qty: 3 }, { bookId: "x", qty: 1 }, { bookId: 2, qty: 999 }, { bookId: 3, qty: 0 }, null, { bookId: -4, qty: 1 }]);
  assert.deepEqual(c, [{ bookId: 1, qty: 5 }, { bookId: 2, qty: 10 }]);
  assert.deepEqual(normalizeCart("nope"), []);
  assert.equal(normalizeCart(Array.from({ length: 50 }, (_, i) => ({ bookId: i + 1, qty: 1 }))).length, 20);
});

test("computeTotals", () => {
  assert.deepEqual(computeTotals([{ unitPriceCents: 1000, qty: 2 }, { unitPriceCents: 550, qty: 1 }], 1500), { subtotalCents: 2550, shippingCents: 1500, totalCents: 4050 });
  assert.deepEqual(computeTotals([], 1500), { subtotalCents: 0, shippingCents: 0, totalCents: 0 });
});

test("validateCustomer", () => {
  const good = validateCustomer({ name: "Ali Khan", email: "ali@example.com", line1: "1 Main St", city: "Leeds", country: "UK" });
  assert.equal(good.ok, true);
  const bad = validateCustomer({ name: "A", email: "nope", line1: "", city: "", country: "" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["city", "country", "email", "line1", "name"]);
  assert.equal(validateCustomer(null).ok, false);
});

test("encodeForm matches Stripe bracket notation", () => {
  const s = decodeURIComponent(encodeForm({ mode: "payment", line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: 500 } }] }));
  assert.equal(s, "mode=payment&line_items[0][quantity]=1&line_items[0][price_data][currency]=usd&line_items[0][price_data][unit_amount]=500");
});

test("verifyStripeSignature", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const now = t * 1000 + 10_000;
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${v1}`, secret, 300, now), true);
  assert.equal(verifyStripeSignature(payload + " ", `t=${t},v1=${v1}`, secret, 300, now), false); // tampered body
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${v1}`, "other", 300, now), false); // wrong secret
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${v1}`, secret, 300, now + 3600_000), false); // too old
  assert.equal(verifyStripeSignature(payload, null, secret, 300, now), false);
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=deadbeef`, secret, 300, now), false);
});
