import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

// Server-side guard: unauthenticated visitors never receive any admin HTML.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div dir="ltr" className="text-left">
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
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/test">Test / Simulation</Link>
          <Link href="/" target="_blank">View site ↗</Link>
        </nav>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
