import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatMoney } from "@/lib/shop";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const orders = await listOrders(status || undefined);
  const tabs = ["", "pending_payment", "paid", "ordered_from_supplier", "shipped", "cancelled", "refunded"];
  return (
    <div className="ad-wrap">
      <h1 className="ad-h1 plain" style={{ marginTop: 34 }}>Order ({orders.length})</h1>
      <div className="ad-pills">
        {tabs.map((t) => (
          <Link key={t} href={t ? `/admin/orders?status=${t}` : "/admin/orders"} className={`ad-pill${(status ?? "") === t ? " on" : ""}`}>{t || "All"}</Link>
        ))}
      </div>
      <div className="ad-box" style={{ overflowX: "auto" }}>
        <table className="ad-otable">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Country</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
                <td>{fmtDateTime(new Date(o.created_at).toISOString()).replace(" UTC", "")}</td>
                <td>{o.name}<small>{o.email}</small></td>
                <td>{o.ship_country}</td>
                <td>{formatMoney(o.total_cents, o.currency)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} style={{ color: "#777" }}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
