import { requireAdmin } from "@/lib/auth";
import { getLogs } from "@/lib/books";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  return Response.json({ logs: await getLogs(id, 100) });
}
