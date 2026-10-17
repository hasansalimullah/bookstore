import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await query(
      `SELECT to_regclass('public.books') IS NOT NULL AS books, to_regclass('public.book_sources') IS NOT NULL AS book_sources,
              to_regclass('public.orders') IS NOT NULL AS orders, to_regclass('public.subscribers') IS NOT NULL AS subscribers,
              to_regclass('public.authors') IS NOT NULL AS authors`,
    );
    const t = r.rows[0] ?? {};
    const ok = Object.values(t).every(Boolean);
    return Response.json({ ok, database: "reachable", tables: t, hint: ok ? undefined : "Run `npm run migrate` from your computer." }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, database: "unreachable", hint: "Check the DATABASE_URL secret in Cloudflare." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}