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
  checkBatchSize: num(process.env.CHECK_BATCH_SIZE, 25),
  userAgent: process.env.USER_AGENT ?? "BookstoreAvailabilityBot/0.1",
  /** Only these hosts may be used as monitoring sources (SSRF guard). */
  allowedSourceHosts: (process.env.ALLOWED_SOURCE_HOSTS ?? "ibnaljawzi.com,www.ibnaljawzi.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  /** If no definite answer for this long, the public site shows "unknown" (stale-data protection). */
  staleAfterMinutes: num(process.env.STALE_AFTER_MINUTES, 60),
  logRetentionDays: num(process.env.LOG_RETENTION_DAYS, 30),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};
