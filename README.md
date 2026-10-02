# Arabic Bookstore MVP — with private availability monitoring

Your own storefront (own name, design, content, URLs). Each book has a **private** source URL that a
server-side worker checks on a schedule. Customers only ever see your site and a status badge:

| Source text | Stored | Customer sees |
|---|---|---|
| `متوفر` | `available` | 🟢 متوفر |
| `غير متوفر` / `غير متوفر حاليًا` | `out_of_stock` | 🔴 غير متوفر |
| anything else (timeout, HTTP error, block, selector missing, HTML changed, unknown text) | `unknown` | 🟡 حالة التوفر غير معروفة |

A failure is **never** treated as "out of stock".

## Architecture

```
Admin (you) ──► /admin (cookie-auth) ──► /api/admin/*  ──┐
                                                          ▼
Customers ──► / , /books/[slug] , /api/books ──►  PostgreSQL
              (PublicBook type only)               ├─ books          (public-safe columns)
                                                   ├─ book_sources   (PRIVATE: source_url_private, schedule)
                                                   └─ check_logs     (PRIVATE: history + debug)
                                                          ▲
Worker (npm run worker, every 30 s)                       │
  claim due books (FOR UPDATE SKIP LOCKED) ─► fetch (timeout, per-host delay, allowlist)
  ─► parse `.product-availablity strong` ─► evaluate ─► write books + book_sources + check_logs
```

Design choices worth knowing:

* **The source URL lives in its own table** (`book_sources`), not a column on `books`. Public queries select an explicit
  column list from `books` only, and the `PublicBook` type has no field that could carry a URL — so a careless `SELECT *`
  or `JSON.stringify(book)` on the public side cannot leak it. (This deliberately differs from the single-table schema you sketched.)
* **The browser never checks anything.** Only the worker (or `/api/cron/check`) makes source requests.
* **Stale protection:** if a book has had no *successful* check for `STALE_AFTER_MINUTES` (default 60), the public site shows 🟡 even if the last stored value was green.
* **Due-queue scheduling** (`next_check_at` + jitter + exponential backoff on failures, honoring `Retry-After`) — no cron-per-book, works with several workers.
* **We do not evade blocks.** HTTP 403/429/503 are recorded as errors and backed off; there is no CAPTCHA/anti-bot bypass.

## Quick start (local, ~5 minutes)

Requirements: Node 22.6+ (uses Node's built-in TypeScript stripping for scripts/tests), Docker (or any PostgreSQL 14+).

```bash
unzip bookstore-mvp.zip && cd bookstore-mvp
cp .env.example .env          # then edit ADMIN_PASSWORD (8+ chars) and SESSION_SECRET (openssl rand -hex 32)
docker compose up -d          # PostgreSQL on :5432   (skip if you have your own; set DATABASE_URL)
npm install
npm run migrate               # creates tables
npm run seed                  # 5 test books using mock:// sources (no real requests)
npm run dev                   # site + admin on http://localhost:3000
npm run worker                # in a 2nd terminal: the scheduler
npm test                      # unit tests (no DB or network needed)
```

* Public site: <http://localhost:3000>
* Admin: <http://localhost:3000/admin> (password = `ADMIN_PASSWORD`)
* Simulation page: <http://localhost:3000/admin/test>

`.env` defaults to `SOURCE_MODE=mock`: nothing ever leaves your machine. The seed books use
`mock://available`, `mock://out_of_stock`, `mock://unknown`, `mock://timeout`, and so on, so all
three states + the error path show up immediately. In mock mode, a normal `https://ibnaljawzi.com/...`
URL is *simulated as available* (no request made).

## Testing plan with 5 books

1. `npm test` — parser, decision logic, fetcher (mock), session/auth helpers, slugs.
2. `npm run seed`, open `/admin`, click **Check Now** on each: expect 🟢, 🟢, 🔴, 🟡 (selector missing), 🟡 (timeout).
3. Open `/admin/test` — run the five scenarios (AVAILABLE, OUT_OF_STOCK, UNKNOWN, timeout, network error) and paste real HTML from "View source" of a product page to see how the parser reads it.
4. **Go live carefully.** Set `SOURCE_MODE=live`, delete the mock books (or edit their source URL), add 5 real books via **Add Book**
   (you'll get the ✓ checklist), then press **Test Connection** on each and confirm `Detected text` really is the right book's status.
   Add one book you know is out of stock and one you know is in stock.
5. `npm run build && npm start`, then `npm run leak-check` (see below).

### Verify nothing leaks

`npm run leak-check` fetches the public pages, every JS/CSS chunk they load and the public API, and fails if it finds
`ibnaljawzi`, `source_url`, `sourceUrl`, or `mock://`. It also confirms every `/api/admin/*` route answers 401/403 to anonymous
visitors and `/admin` redirects to login. Run it against production too: `BASE_URL=https://yoursite.com npm run leak-check`.
Also open "View source" on a book page yourself.

## Admin features

Add / edit / delete books · paste the private URL · **Import / Add Book** with immediate check + ✓ checklist · **Check Now** ·
**Test Connection** (HTTP status, selector found, detected text, parsed status, timestamp — admin only, no DB write) ·
current availability · last check time · last result · consecutive failures · next scheduled check · full check history with
parse details · monitoring on/off per book · publish/unpublish.

## Security checklist (how each requirement is met)

1. Source URL only server-side → `book_sources` table; read only by worker and `/api/admin/*`.
2. Never returned by public APIs → public routes use `PublicBook`; `leak-check` verifies.
3. Customers can't reach admin endpoints → every `/api/admin/*` handler starts with `requireAdmin()`; `/admin/(protected)` layout redirects server-side (no admin HTML is sent to anonymous users).
4. Customers can't modify data → no public write endpoints exist.
5. Admin auth required → signed, HttpOnly, SameSite=Lax cookie (HMAC-SHA256, 8h); constant-time password check; login throttle; fails closed if `ADMIN_PASSWORD`/`SESSION_SECRET` are missing/short. Mutating admin requests also require a same-origin `Origin` header (CSRF).
6/7. No source URL in JS or metadata → admin-only code paths; `config.ts` (which holds the allowed host) is imported by server modules only.
8. No redirects/links to the source anywhere on the public side.
9. Public errors are generic ("temporarily unavailable").
10. Logs/debug info → `check_logs` only served by `/api/admin/.../logs`.
* Extra: only `https://` URLs on `ALLOWED_SOURCE_HOSTS` can be saved or fetched (SSRF guard; redirects off-host are rejected); response size capped at 2 MB; `noindex` on admin.

## Salla: what I found

* Third-party directories (e.g. Store Leads) list `ibnaljawzi.com` as a **Salla** store, which fits the `product-availablity` markup you found. That's a directory listing, not an official statement — treat it as likely, not certain.
* Salla has an official **Merchant API** (`https://api.salla.dev/admin/v2`) with a *Product Quantity* endpoint (`GET /products/quantities`, scope `products.read`). It requires an OAuth 2.0 bearer token that the **store owner** grants by installing/authorizing your app; the merchant can revoke it any time.
* So: the official API is only usable if ibnaljawzi.com authorizes you (e.g. a supplier/partnership arrangement). **If they do, it's clearly preferable** to HTML parsing: structured data, exact quantities, no breakage when their theme changes, webhooks instead of polling, and no scraping-policy ambiguity. Without their authorization there is no official public way to read another store's inventory.
* Plan: keep the HTML checker as the default; ask them for API access. The fetch → evaluate split (`source-fetcher.ts` / `evaluate.ts`) is where a Salla adapter would plug in (Salla API → private backend → DB → your site; tokens in env/DB, never sent to the browser). I have **not** built the Salla adapter since there are no credentials yet.
* Regardless of approach: check their `robots.txt` and terms of use, keep the request rate low (defaults are conservative), and set `USER_AGENT` to something with a contact email. A short message asking for permission is the safest route.

## Bulk import from a Google Sheet / CSV

Admin → **Import**. Row 1 headers: `Supplier product URL | Title | Author | Slug | Price | Image URL | Description`
(only the first two are required; order doesn't matter). Paste the cells (copied from Google Sheets), upload a CSV, or give a
Sheets link (the sheet must be shared "Anyone with the link → Viewer" — it holds private supplier URLs, so prefer copy/upload, or turn sharing off afterwards).

* **Preview first**: shows create / update / error per row before anything is saved. Rows with errors are skipped.
* Empty Slug → auto-made from the title (Arabic is transliterated), with `-2`, `-3` if taken. Explicit slugs that clash are errors.
* Re-importing is safe: a row whose supplier URL already exists **updates** that book (existing slugs never change; empty cells keep current values).
* Max 500 rows per import; everything is saved in one transaction. New books are picked up by the scheduler within minutes.

## Shop (cart → checkout → orders)

* Customers: browse → **Add to cart** (only when 🟢 in stock and a price is set) → `/cart` → `/checkout` (shipping details) → pay → `/order/<unguessable id>`.
* The server decides prices and availability at checkout; nothing from the browser is trusted. Flat worldwide shipping: `SHIPPING_FLAT_CENTS`.
* `PAYMENT_MODE=manual` (default in `.env.example`): checkout just creates the order — use this to test the flow with no Stripe account.
* `PAYMENT_MODE=stripe`: redirects to Stripe Checkout. Set `STRIPE_SECRET_KEY`, create a webhook in Stripe pointing to
  `https://YOURSITE/api/stripe/webhook` (events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.expired`, `checkout.session.async_payment_failed`) and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
  Only the signature-verified webhook marks an order **paid** (and only if the amount matches).
* Admin → **Orders**: customer + address, items, the private supplier link (admin only) and current stock for each item, status
  (`pending_payment → paid → ordered_from_supplier → shipped`), tracking info (shown to the customer), internal notes.
* Orders and addresses are only reachable through admin routes. The customer order page shows items, totals and status only.
* Not included yet: emails (Resend), refunds through Stripe (do those in the Stripe dashboard and set the order to `refunded`), taxes, per-country shipping rates, customer accounts.

## Deploying on Cloudflare (Workers)

Uses the OpenNext adapter (`@opennextjs/cloudflare`), which runs the Next.js app as a Worker. Already configured: `wrangler.jsonc`,
`open-next.config.ts`, and a database layer that opens a short-lived connection per query when running on Workers.

```bash
npm install
npx wrangler login
npm run cf:deploy          # builds + uploads; prints https://bookstore.<you>.workers.dev
```

Then in the Cloudflare dashboard → Workers & Pages → **bookstore** → Settings → Variables and Secrets, add these as **Secret** type
(secrets survive redeploys): `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SOURCE_MODE` (= `live`), `CRON_SECRET`, `USER_AGENT`,
`CHECK_INTERVAL_MINUTES`, `PAYMENT_MODE`, `SHIPPING_FLAT_CENTS`, and for Stripe `SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
Run `npm run migrate` from your computer (with `DATABASE_URL` in your local `.env`) whenever a new migration file is added.

**Scheduler:** Workers can't run `npm run worker`, so `cron-worker/` is a tiny second Worker with a Cron Trigger (every minute, Cloudflare's minimum) that calls
`/api/cron/check` through a service binding:

```bash
cd cron-worker
npx wrangler deploy
npx wrangler secret put CRON_SECRET     # paste the SAME value you used for the shop
```

If the service-binding call ever fails, use any external scheduler instead (e.g. cron-job.org): GET `https://YOURSITE/api/cron/check`
with header `Authorization: Bearer <CRON_SECRET>`.

Notes: Workers Free has a 3 MiB compressed size limit for the Worker — if the deploy reports the script is too large you need the
Workers Paid plan. Connections to Postgres are opened per query on Workers; Cloudflare Hyperdrive would speed that up later.
Cookies are `Secure`, so use the HTTPS URL. Custom domain: Workers → Settings → Domains & Routes.

Other hosts (VPS / Vercel) still work: `npm run build && npm start` + `npm run worker` on a VPS; on Vercel use `/api/cron/check` with an external scheduler.

## Scaling from 5 → thousands of books

Already in place: due-queue with an index on `next_check_at`, jittered schedule, failure backoff, `SKIP LOCKED` (run multiple workers safely), batch claiming with a lease, log retention (`LOG_RETENTION_DAYS`).

**Do the arithmetic first.** The politeness delay is per host: with `CHECK_MIN_DELAY_MS=1500` one worker makes at most
~40 requests/minute to the source. 400 books → 10-minute cycle is fine; **1,000 books needs ≥ ~25 minutes per cycle**, 5,000 books ≈ 2 hours. Options, in order of preference:

1. **Salla API access** (bulk quantities in a few calls instead of one page per book) — by far the best at scale.
2. **Tiered intervals:** check in-stock books less often than out-of-stock ones you're waiting on; check popular books more often (add a `priority`/`interval_minutes` column to `book_sources` and use it in `nextDelayMs`).
3. **Conditional requests** (ETag / If-Modified-Since) if the source supports them.
4. Only then raise concurrency / lower delay — ask the source first; being blocked costs more than a longer interval.

Other steps as you grow: move the queue to Redis + BullMQ (your stated stack) if you need many workers; partition or aggregate `check_logs` (keep only status *changes* after 30 days); add a status-change notifier (e.g. email when a book flips available ⇄ out of stock); put a CDN in front of public pages (they already send `s-maxage=30` on the API).

## Known limitations / things to verify

* The parser is built from the HTML snippet you provided. Salla themes can render more than one `.product-availablity` (e.g. in "related products" cards). The **first** match is used and the count is shown in debug (`Containers matched`); if you see `> 1`, use **Test Connection** to confirm the detected text belongs to the main product. JSON-LD availability is shown as a cross-check but never used for the decision.
* Only the exact phrases `متوفر`, `متوفر حاليا`, `غير متوفر…` are recognized (after harakat/alef normalization). Other wording (e.g. "قريبًا", "نفذت الكمية") deliberately yields 🟡 until you add it to `src/lib/parser.ts`.
* Single admin password (no user accounts) — fine for an MVP.
* No cart/checkout yet; this MVP is the catalog + availability system.
* Built and unit-tested in a sandbox without npm/PostgreSQL access: the parser/decision/session/fetcher tests pass (35), but `next build`, the SQL, and the pages haven't been run against a live database yet. Expect to fix small type or SQL issues on first run and use `npm run leak-check` after building.

## Project layout

```
migrations/001_init.sql        schema (books, book_sources, check_logs)
scripts/                       migrate.ts, seed.ts, leak-check.ts
src/lib/parser.ts              dependency-free `.product-availablity strong` parser
src/lib/evaluate.ts            pure decision rules, backoff, stale protection
src/lib/source-fetcher.ts      guarded fetch + mock mode
src/lib/checker.ts             claim/run/persist checks
src/lib/books.ts               public vs admin queries (separate types)
src/worker/index.ts            the scheduler process
src/app/api/…                  public API, admin API, cron endpoint
src/app/(public pages), admin/ storefront + dashboard + test lab
tests/                         node:test suites
```

## Freshness rules (why customers rarely see "Checking availability…")

* A failed check never overwrites the last known status. The public site keeps showing it for up to `STALE_AFTER_MINUTES` (default 360); after that it shows "Checking availability…" and the book can't be added to the cart.
* At checkout, any item the scheduler hasn't checked in the last 2 minutes is re-checked live (max 5). A confirmed out-of-stock blocks the order; an inconclusive check falls back to the last known status.
* Admin shows a red banner if no scheduled check has run recently (usually: the cron-worker isn't deployed).
* `CHECK_INTERVAL_MINUTES=1` + the every-minute cron = each book is checked about once a minute. Checking 500+ books that often is not possible politely (see "Scaling").

## Storefront design

The home page and product page follow the Canva mockups (1366px desktop; a simple responsive fallback below 1100px).

* **Styles:** `src/app/store.css` (design tokens at the top: tan `#ccb38b`, dark `#4b4234`, brown `#846a40`, gold `#bc9353`). Fonts: Poppins, Oswald, Inter, Noto Sans Arabic via `next/font`.
* **Content you edit:** `src/content/site.ts` — announcement bar, nav links, hero slides, carousel sections (title + category), promo cards, link buttons, contact block, stats, newsletter, footer text/links.
* **Images:** `public/assets/` (logo, pattern, stat icons, hero banner, promo images). These were cut out of the mockup PNGs at 1x — replace with the original/high-resolution files (same filenames) for crisp results on retina screens.
* **Per-book fields** (admin + import): Title, Title (Arabic), Author, Category (`Fiqh & Ahkam > Fiqh Hanbali > Usul Madhhab` → breadcrumb), Price, main image + up to 2 extra images (thumbnails), Description, Edition, Cover, Print Quality, Format, Harakat.
* **Carousels** show books whose Category contains the section's `category` word (e.g. "Tafsir"); until you have such books they show the newest books.
* **Newsletter:** emails are saved in the database (Admin → Subscribers (CSV)). No email is sent automatically.
* Wishlist (heart) is saved in the visitor's browser only; Account/Login/Registration pages are placeholders ("coming soon").

## Admin panel design

* Styles: `src/app/admin.css` (same palette as the storefront). Shell (header + nav pill + footer): `src/app/admin/layout.tsx`, `src/components/admin/AdminNav.tsx`.
* **Books** tab = Add Book form + **Authors** grid. Click an author to see their books (Check Now / Test Connection / Delete per book, plus Check All / Test All). Books without an author appear under "No author".
* Authors are created from the "+" button, from the Author dropdown ("+ New author…"), or automatically from the Author column when you import a sheet. Rename/Delete author live on the author page.
* The Add/Edit form shows the fields from your design; the extra product-page fields (second title, category, edition, cover, print quality, format, harakat, extra images) are inside "More details".
