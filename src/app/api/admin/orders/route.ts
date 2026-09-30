import { requireAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return Response.json({ orders: await listOrders(status || undefined) });
}
