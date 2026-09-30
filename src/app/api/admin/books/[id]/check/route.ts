import { requireAdmin } from "@/lib/auth";
import { checkBookNow } from "@/lib/checker";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// "Check Now" — records a history row and updates availability.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "bad id" }, { status: 400 });
  const out = await checkBookNow(id);
  return out ? Response.json(out) : Response.json({ error: "no source configured" }, { status: 404 });
}
