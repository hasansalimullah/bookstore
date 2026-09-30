import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatMoney } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const orders = await listOrders(status || undefined);
  const tabs = ["", "pending_payment", "paid", "ordered_from_supplier", "shipped", "cancelled", "refunded"];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Orders ({orders.length})</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link key={t} href={t ? `/admin/orders?status=${t}` : "/admin/orders"} className={`rounded-full border px-3 py-1 ${(status ?? "") === t ? "bg-stone-800 text-white" : "bg-white"}`}>
            {t || "all"}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left">
            <tr><th className="p-2">Order</th><th className="p-2">Date</th><th className="p-2">Customer</th><th className="p-2">Country</th><th className="p-2">Total</th><th className="p-2">Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-stone-100">
                <td className="p-2"><Link className="text-emerald-800 underline" href={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
                <td className="p-2">{new Date(o.created_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="p-2">{o.name}<div className="text-xs text-stone-500">{o.email}</div></td>
                <td className="p-2">{o.ship_country}</td>
                <td className="p-2">{formatMoney(o.total_cents, o.currency)}</td>
                <td className="p-2">{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="p-4 text-stone-500" colSpan={6}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
