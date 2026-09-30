// Long-running availability worker:  npm run worker
// Every 30s it claims books whose next_check_at has passed and checks them.
import { config } from "../lib/config.ts";
import { pool } from "../lib/db.ts";
import { processDueBatch, purgeOldLogs } from "../lib/checker.ts";

const TICK_MS = 30_000;
let stopping = false;
let running = false;

async function tick() {
  if (running || stopping) return;
  running = true;
  try {
    // Keep draining while there is a backlog, then wait for the next tick.
    for (let n = await processDueBatch(); n > 0 && !stopping; n = await processDueBatch()) {
      console.log(`[worker] checked ${n} book(s)`);
    }
  } catch (err) {
    console.error("[worker] tick error:", err instanceof Error ? err.message : err);
  } finally {
    running = false;
  }
}

async function main() {
  console.log(`[worker] started. mode=${config.sourceMode} interval=${config.checkIntervalMinutes}m concurrency=${config.checkConcurrency}`);
  if (config.sourceMode === "live" && !process.env.USER_AGENT) {
    console.warn("[worker] tip: set USER_AGENT with a contact address so the source can reach you.");
  }
  await tick();
  const t = setInterval(tick, TICK_MS);
  const purge = setInterval(() => purgeOldLogs().then((n) => n && console.log(`[worker] purged ${n} old log rows`)).catch(() => {}), 6 * 3600_000);

  const shutdown = async () => {
    stopping = true;
    clearInterval(t);
    clearInterval(purge);
    console.log("[worker] shutting down…");
    while (running) await new Promise((r) => setTimeout(r, 200));
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
