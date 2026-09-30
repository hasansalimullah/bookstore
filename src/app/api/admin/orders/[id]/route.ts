import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, getAdminOrder, updateOrder, type OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const order = Number.isInteger(id) ? await getAdminOrder(id) : null;
  return order ? Response.json({ order }) : Response.json({ error: "not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Parameters<typeof updateOrder>[1] = {};
  if (typeof b.status === "string") {
    if (!(ORDER_STATUSES as readonly string[]).includes(b.status)) return Response.json({ error: "invalid status" }, { status: 400 });
    patch.status = b.status as OrderStatus;
  }
  if (typeof b.adminNotes === "string") patch.adminNotes = b.adminNotes.slice(0, 5000);
  if (typeof b.trackingInfo === "string") patch.trackingInfo = b.trackingInfo.slice(0, 500);
  await updateOrder(id, patch);
  return Response.json({ ok: true });
}
