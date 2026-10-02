import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";
import { config } from "@/lib/config";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Server-side guard: unauthenticated visitors never receive any admin HTML.
async function schedulerStalled(): Promise<boolean> {
  try {
    const r = await query(
      `SELECT (SELECT count(*) FROM book_sources WHERE monitoring_enabled) AS books,
              (SELECT max(checked_at) FROM check_logs WHERE trigger = 'scheduled') AS last_run`,
    );
    const books = Number(r.rows[0]?.books ?? 0);
    const last = r.rows[0]?.last_run ? new Date(r.rows[0].last_run).getTime() : 0;
    const allowedGapMs = Math.max(10, config.checkIntervalMinutes * 4) * 60_000;
    return books > 0 && Date.now() - last > allowedGapMs;
  } catch {
    return false;
  }
}

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const stalled = await schedulerStalled();
  return (
    <div dir="ltr" className="text-left">
      {stalled && (
        <div className="mb-4 rounded-lg border-2 border-red-400 bg-red-50 p-3 text-sm font-medium text-red-900">
          🚨 The automatic checker hasn&apos;t run recently, so availability is going out of date. Deploy the cron-worker (see README) or check that it is running.
        </div>
      )}
      {config.sourceMode === "mock" && (
        <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          ⚠️ SOURCE_MODE is &quot;mock&quot;: availability results are FAKE (real links are simulated as in stock). Set SOURCE_MODE=live to check the real site.
        </div>
      )}
      {config.paymentMode === "manual" && (
        <div className="mb-4 rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm text-stone-700">
          PAYMENT_MODE is &quot;manual&quot;: checkout creates the order without taking payment. Set PAYMENT_MODE=stripe (plus Stripe keys) to accept cards.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-stone-800 px-4 py-2 text-sm text-white">
        <nav className="flex gap-4">
          <Link href="/admin">Books</Link>
          <Link href="/admin/import">Import</Link>
          <Link href="/admin/orders">Orders</Link>
          <a href="/api/admin/subscribers">Subscribers (CSV)</a>
          <Link href="/admin/test">Test / Simulation</Link>
          <Link href="/" target="_blank">View site ↗</Link>
        </nav>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
