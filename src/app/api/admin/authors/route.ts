import { requireAdmin } from "@/lib/auth";
import { ensureAuthor, listAuthors } from "@/lib/authors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return Response.json(await listAuthors());
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { name?: unknown };
  const a = typeof b.name === "string" ? await ensureAuthor(b.name) : null;
  return a ? Response.json({ author: a }, { status: 201 }) : Response.json({ error: "Enter an author name" }, { status: 400 });
}
