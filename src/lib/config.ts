// Server-only configuration. NEVER import this file from a "use client" component.
const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/bookstore",
  sourceMode: (process.env.SOURCE_MODE === "live" ? "live" : "mock") as "live" | "mock",
  checkIntervalMinutes: num(process.env.CHECK_INTERVAL_MINUTES, 10),
  checkTimeoutMs: num(process.env.CHECK_TIMEOUT_MS, 10_000),
  checkConcurrency: num(process.env.CHECK_CONCURRENCY, 2),
  checkMinDelayMs: num(process.env.CHECK_MIN_DELAY_MS, 1_500),
  checkBatchSize: num(process.env.CHECK_BATCH_SIZE, 15),
  userAgent: process.env.USER_AGENT ?? "BookstoreAvailabilityBot/0.1",
  /** Only these hosts may be used as monitoring sources (SSRF guard). */
  allowedSourceHosts: (process.env.ALLOWED_SOURCE_HOSTS ?? "ibnaljawzi.com,www.ibnaljawzi.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  /** If no definite answer for this long, the public site shows "unknown" (stale-data protection). */
  staleAfterMinutes: num(process.env.STALE_AFTER_MINUTES, 360),
  logRetentionDays: num(process.env.LOG_RETENTION_DAYS, 30),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",

  // ---- shop ----
  /** "stripe" = pay with Stripe Checkout; "manual" = create the order and you arrange payment yourself (good for testing). */
  paymentMode: (process.env.PAYMENT_MODE === "manual" ? "manual" : "stripe") as "stripe" | "manual",
  currency: (process.env.CURRENCY ?? "usd").toLowerCase(),
  shippingFlatCents: Math.max(0, Math.round(Number(process.env.SHIPPING_FLAT_CENTS ?? 1500)) || 0),
  siteUrl: (process.env.SITE_URL ?? "").replace(/\/$/, ""),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
