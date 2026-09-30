import pg from "pg";
import type { QueryResult, QueryResultRow } from "pg";
import { config } from "./config.ts";

const g = globalThis as unknown as { __pgPool?: InstanceType<typeof pg.Pool> };

export const pool =
  g.__pgPool ??
  new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") g.__pgPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
