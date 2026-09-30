import { timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";
import { processDueBatch } from "@/lib/checker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// For serverless hosts without a long-running worker (e.g. Vercel Cron → every 5 min).
// Disabled unless CRON_SECRET is set. Send:  Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const secret = config.cronSecret;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (secret.length < 16 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response("not found", { status: 404 });
  }
  const checked = await processDueBatch();
  return Response.json({ checked });
}
