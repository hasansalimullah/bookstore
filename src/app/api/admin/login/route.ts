import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken, passwordMatches } from "@/lib/session";

// Tiny in-memory throttle: 5 failures / 15 min per IP. (Use a shared store if you run several instances.)
const fails = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const rec = fails.get(ip);
  if (rec && rec.n >= 5 && rec.until > Date.now()) {
    return Response.json({ error: "too many attempts, try later" }, { status: 429 });
  }
  if (!config.sessionSecret || config.sessionSecret.length < 16 || config.adminPassword.length < 8) {
    return Response.json({ error: "admin login is not configured (set ADMIN_PASSWORD and SESSION_SECRET)" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!passwordMatches(config.adminPassword, String(body.password ?? ""))) {
    fails.set(ip, { n: (rec && rec.until > Date.now() ? rec.n : 0) + 1, until: Date.now() + 15 * 60_000 });
    return Response.json({ error: "invalid password" }, { status: 401 });
  }
  fails.delete(ip);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(config.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return Response.json({ ok: true });
}
