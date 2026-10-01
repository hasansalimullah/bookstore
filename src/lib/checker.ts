// DB-backed checking: claim due books, run a check, store result + history.
import type { PoolClient } from "pg";
import { config } from "./config.ts";
import { pool } from "./db.ts";
import { fetchSourcePage, type FetchResult } from "./source-fetcher.ts";
import { evaluateFetch, nextDelayMs, type Evaluation } from "./evaluate.ts";

export type Trigger = "scheduled" | "manual" | "test" | "checkout";

export interface CheckOutcome {
  bookId: number;
  evaluation: Evaluation;
  fetch: Pick<FetchResult, "httpStatus" | "durationMs" | "simulated" | "errorCode" | "errorMessage">;
  checkedAt: string;
}

/** Atomically claim due books. SKIP LOCKED makes multiple workers safe; the 5-min lease prevents double checks. */
export async function claimDueBooks(limit: number): Promise<{ bookId: number; url: string; failures: number }[]> {
  const { rows } = await pool.query(
    `UPDATE book_sources s
        SET next_check_at = now() + interval '5 minutes'
      WHERE s.book_id IN (
        SELECT book_id FROM book_sources
         WHERE monitoring_enabled AND next_check_at <= now()
         ORDER BY next_check_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED)
      RETURNING s.book_id, s.source_url_private, s.consecutive_failures`,
    [limit],
  );
  return rows.map((r) => ({ bookId: Number(r.book_id), url: r.source_url_private, failures: r.consecutive_failures }));
}

/** Run one check for an already-known URL and persist everything. */
export async function runCheck(bookId: number, url: string, prevFailures: number, trigger: Trigger): Promise<CheckOutcome> {
  const f = await fetchSourcePage(url);
  const ev = evaluateFetch(f);
  const checkedAt = new Date();
  const failures = ev.outcome === "ok" ? 0 : prevFailures + 1;
  const delay = nextDelayMs({
    intervalMinutes: config.checkIntervalMinutes,
    consecutiveFailures: failures,
    retryAfterSec: f.retryAfterSec,
  });

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE books
          -- A failed check must NOT flip the book to "unknown": keep the last known status.
          SET availability = CASE WHEN $4 = 'ok' THEN $2 ELSE availability END,
              last_checked = $3,
              last_success_at = CASE WHEN $4 = 'ok' THEN $3 ELSE last_success_at END,
              updated_at = now()
        WHERE id = $1`,
      [bookId, ev.availability, checkedAt, ev.outcome],
    );
    await client.query(
      `UPDATE book_sources
          SET last_check_status = $2,
              last_error = $3,
              consecutive_failures = $4,
              next_check_at = CASE WHEN $5 = 'scheduled' THEN $6 ELSE next_check_at END,
              updated_at = now()
        WHERE book_id = $1`,
      [bookId, ev.outcome, ev.errorMessage, failures, trigger, new Date(checkedAt.getTime() + delay)],
    );
    await client.query(
      `INSERT INTO check_logs
         (book_id, checked_at, trigger, outcome, parsed_status, http_status, selector_found,
          detected_text, reason, error_message, duration_ms, debug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        bookId,
        checkedAt,
        trigger,
        ev.outcome,
        ev.parsedStatus,
        f.httpStatus,
        ev.parse ? ev.parse.selectorFound : null,
        ev.parse?.detectedText ?? null,
        ev.reason,
        ev.errorMessage,
        f.durationMs,
        JSON.stringify({ parse: ev.parse, simulated: f.simulated, retryAfterSec: f.retryAfterSec }),
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return {
    bookId,
    evaluation: ev,
    fetch: { httpStatus: f.httpStatus, durationMs: f.durationMs, simulated: f.simulated, errorCode: f.errorCode, errorMessage: f.errorMessage },
    checkedAt: checkedAt.toISOString(),
  };
}

/** Manual "Check Now" for a book id (admin). */
export async function checkBookNow(bookId: number, trigger: Trigger = "manual"): Promise<CheckOutcome | null> {
  const { rows } = await pool.query(
    "SELECT source_url_private, consecutive_failures FROM book_sources WHERE book_id = $1",
    [bookId],
  );
  if (!rows[0]) return null;
  return runCheck(bookId, rows[0].source_url_private, rows[0].consecutive_failures, trigger);
}

/** Process one batch of due books with limited concurrency. Returns how many were checked. */
export async function processDueBatch(): Promise<number> {
  const due = await claimDueBooks(config.checkBatchSize);
  let i = 0;
  const worker = async () => {
    while (i < due.length) {
      const job = due[i++];
      try {
        await runCheck(job.bookId, job.url, job.failures, "scheduled");
      } catch (err) {
        // DB failure etc. The lease (5 min) means it will be retried automatically.
        console.error(`[worker] check failed for book ${job.bookId}:`, err instanceof Error ? err.message : err);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(config.checkConcurrency, due.length) }, worker));
  return due.length;
}

export async function purgeOldLogs(): Promise<number> {
  const r = await pool.query(`DELETE FROM check_logs WHERE checked_at < now() - ($1 || ' days')::interval`, [String(config.logRetentionDays)]);
  return r.rowCount ?? 0;
}
