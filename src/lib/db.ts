import pg from "pg";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { config } from "./config.ts";

/**
 * Two runtimes:
 *  - Node (local dev, `npm run worker`, scripts, VPS): a normal connection pool.
 *  - Cloudflare Workers: connections can NOT be shared between requests, so every query (or transaction)
 *    opens a short-lived connection and closes it afterwards.
 */
const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

type PoolLike = {
  query: (text: string, params?: unknown[]) => Promise<QueryResult<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  connect: () => Promise<PoolClient>;
  end: () => Promise<void>;
};

function makeWorkersPool(): PoolLike {
  const open = async () => {
    const c = new pg.Client({ connectionString: config.databaseUrl });
    await c.connect();
    return c;
  };
  return {
    async query(text, params) {
      const c = await open();
      try {
        return await c.query(text, params);
      } finally {
        await c.end().catch(() => {});
      }
    },
    async connect() {
      const c = await open();
      (c as unknown as { release: () => void }).release = () => void c.end().catch(() => {});
      return c as unknown as PoolClient;
    },
    async end() {},
  };
}

const g = globalThis as unknown as { __pgPool?: PoolLike };

export const pool: PoolLike =
  g.__pgPool ??
  (isWorkers
    ? makeWorkersPool()
    : (new pg.Pool({
        connectionString: config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }) as unknown as PoolLike));

if (process.env.NODE_ENV !== "production") g.__pgPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  return pool.query(text, params) as Promise<QueryResult<T>>;
}
