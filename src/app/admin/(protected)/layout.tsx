import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

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

// Server-side guard: unauthenticated visitors never receive any admin HTML.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const stalled = await schedulerStalled();
  return (
    <div className="ad-main" style={{ display: "flex", flexDirection: "column" }}>
      <AdminNav />
      {stalled && (
        <div className="ad-banner err">
          🚨 The automatic checker hasn&apos;t run recently, so availability is going out of date. Deploy the cron-worker (see README) or check that it is running.
        </div>
      )}
      {config.sourceMode === "mock" && (
        <div className="ad-banner warn">
          ⚠️ SOURCE_MODE is &quot;mock&quot;: availability results are FAKE (real links are simulated as in stock). Set SOURCE_MODE=live to check the real site.
        </div>
      )}
      {config.paymentMode === "manual" && (
        <div className="ad-banner info">
          PAYMENT_MODE is &quot;manual&quot;: checkout creates the order without taking payment. Set PAYMENT_MODE=stripe (plus Stripe keys) to accept cards.
        </div>
      )}
      {children}
    </div>
  );
}
