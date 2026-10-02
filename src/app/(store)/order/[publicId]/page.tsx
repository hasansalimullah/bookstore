import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

const LABEL: Record<string, string> = {
  pending_payment: "Waiting for payment",
  paid: "Payment received — we're preparing your order",
  ordered_from_supplier: "Order is being sourced",
  shipped: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ publicId: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { publicId } = await params;
  const { paid } = await searchParams;
  const order = await getPublicOrder(publicId).catch(() => null);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-10">
      <h1 className="text-2xl font-bold">Order {String(order.public_id).slice(0, 8).toUpperCase()}</h1>
      {paid === "1" && order.status === "pending_payment" && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">Thanks! We&apos;re confirming your payment — refresh this page in a moment.</p>
      )}
      <p className="rounded-lg border border-stone-200 bg-white p-4 font-medium">{LABEL[order.status] ?? order.status}</p>
      {order.tracking_info && <p className="text-sm">Tracking: {order.tracking_info}</p>}
      <ul className="divide-y rounded-lg border border-stone-200 bg-white">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between p-3 text-sm">
            <span>{i.title} × {i.quantity}</span>
            <span>{formatMoney(i.unit_price_cents * i.quantity, order.currency)}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 text-sm"><span>Shipping</span><span>{formatMoney(order.shipping_cents, order.currency)}</span></li>
        <li className="flex justify-between p-3 font-bold"><span>Total</span><span>{formatMoney(order.total_cents, order.currency)}</span></li>
      </ul>
      {order.status === "pending_payment" && (
        <p className="text-sm text-stone-600">If you were not redirected to payment, please contact us with this order number.</p>
      )}
      <Link href="/" className="text-emerald-700 underline">Continue shopping</Link>
    </div>
  );
}
