import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/orders";
import OrderEditor from "@/components/admin/OrderEditor";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = Number.isInteger(id) ? await getAdminOrder(id) : null;
  if (!order) notFound();
  // Dates → strings so the object is safe to pass to a client component.
  return <OrderEditor order={JSON.parse(JSON.stringify(order))} />;
}
