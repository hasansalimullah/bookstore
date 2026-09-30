// Verifies that the PUBLIC site never exposes the source URL/host, and that admin endpoints are locked.
// Usage (server must be running):  npm run leak-check            (BASE_URL defaults to http://localhost:3000)
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const needles = ["ibnaljawzi", ...(process.env.ALLOWED_SOURCE_HOSTS ?? "").split(",").map((s) => s.trim()).filter(Boolean), "source_url", "sourceUrl", "mock://"];

let failures = 0;
const fail = (m: string) => { failures++; console.error("✗", m); };
const pass = (m: string) => console.log("✓", m);

function scan(label: string, text: string) {
  const hay = text.toLowerCase();
  const hits = needles.filter((n) => hay.includes(n.toLowerCase()));
  hits.length ? fail(`${label} contains: ${hits.join(", ")}`) : pass(`${label} clean`);
}

async function get(path: string, init?: RequestInit) {
  return fetch(BASE + path, { redirect: "manual", ...init });
}

async function main() {
  const list = await get("/api/books");
  const listText = await list.text();
  scan("/api/books", listText);
  const books = (JSON.parse(listText).books ?? []) as { slug: string }[];
  if (!books.length) console.warn("! no books found — run `npm run seed` first for a meaningful check");

  const pages = ["/", ...books.map((b) => `/books/${b.slug}`)];
  const assets = new Set<string>();
  for (const p of pages) {
    const html = await (await get(p)).text();
    scan(`page ${p}`, html);
    for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)) assets.add(m[1]);
  }
  for (const b of books.slice(0, 5)) scan(`/api/books/${b.slug}`, await (await get(`/api/books/${b.slug}`)).text());

  for (const a of assets) scan(`asset ${a.slice(0, 60)}`, await (await get(a)).text());

  // Admin must be locked for anonymous visitors.
  for (const [method, path] of [["GET", "/api/admin/books"], ["GET", "/api/admin/books/1"], ["GET", "/api/admin/books/1/logs"], ["POST", "/api/admin/books/1/check"], ["POST", "/api/admin/test-connection"], ["POST", "/api/admin/test-parse"], ["DELETE", "/api/admin/books/1"]] as const) {
    const r = await get(path, { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? "{}" : undefined });
    [401, 403].includes(r.status) ? pass(`${method} ${path} → ${r.status}`) : fail(`${method} ${path} → ${r.status} (expected 401/403)`);
  }
  const adminPage = await get("/admin");
  const loc = adminPage.headers.get("location") ?? "";
  adminPage.status >= 300 && adminPage.status < 400 && loc.includes("/admin/login") ? pass("/admin redirects anonymous users to login") : fail(`/admin → ${adminPage.status} ${loc}`);

  // Public write attempts must fail.
  const w = await get("/api/books", { method: "POST", body: "{}" });
  [404, 405].includes(w.status) ? pass(`POST /api/books → ${w.status}`) : fail(`POST /api/books → ${w.status}`);

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll leak checks passed");
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
