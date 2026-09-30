import { cookies } from "next/headers";
import { config } from "./config.ts";
import { SESSION_COOKIE, verifySessionToken } from "./session.ts";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(config.sessionSecret, jar.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for every /api/admin/* handler. Returns a Response to send back (401/403) or null if allowed.
 * Also blocks cross-site mutating requests (CSRF) by requiring a same-origin Origin header.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    let ok = false;
    try {
      ok = !!origin && !!host && new URL(origin).host === host;
    } catch {
      ok = false;
    }
    if (!ok) return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}
