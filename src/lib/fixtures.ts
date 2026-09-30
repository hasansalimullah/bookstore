// HTML fixtures used by the admin test page, the mock source mode, and unit tests.
// They contain NO real source URLs.

export const FIXTURE_AVAILABLE = `<html><body><h1>كتاب</h1>
<div class="product-availablity flex items-center gap-2">
    <span class="product-available-dot mx-1"></span>
    <strong class="text-green-500">متوفر</strong>
</div></body></html>`;

export const FIXTURE_OUT_OF_STOCK = `<html><body>
<div class="product-availablity flex items-center gap-2">
    <span class="product-available-dot mx-1"></span>
    <strong class="text-red-500">غير متوفر</strong>
</div></body></html>`;

export const FIXTURE_OUT_OF_STOCK_CURRENTLY = `<div class="product-availablity"><strong>غير متوفر حاليًا</strong></div>`;

export const FIXTURE_MISSING_ELEMENT = `<html><body><h1>كتاب</h1><p>لا يوجد عنصر التوفر هنا</p></body></html>`;

export const FIXTURE_MISSING_STRONG = `<div class="product-availablity"><span class="product-available-dot"></span><span>متوفر</span></div>`;

export const FIXTURE_UNEXPECTED = `<html><body><div class="cf-challenge">Just a moment...</div></body></html>`;

export type ScenarioName = "available" | "out_of_stock" | "unknown" | "error" | "timeout";

export const SCENARIO_HTML: Record<"available" | "out_of_stock" | "unknown", string> = {
  available: FIXTURE_AVAILABLE,
  out_of_stock: FIXTURE_OUT_OF_STOCK,
  unknown: FIXTURE_MISSING_ELEMENT,
};
