// Pure crypto helpers for the admin session cookie (no Next imports → unit-testable).
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 8 * 3600_000;

function sign(secret: string, exp: number): string {
  return createHmac("sha256", secret).update(`admin:${exp}`).digest("hex");
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const exp = now + SESSION_TTL_MS;
  return `${exp}.${sign(secret, exp)}`;
}

export function verifySessionToken(secret: string, token: string | undefined | null, now = Date.now()): boolean {
  if (!secret || secret.length < 16 || !token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || !sig || exp < now) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(secret, exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Constant-time password comparison (hash first so lengths match). */
export function passwordMatches(expected: string, given: string): boolean {
  if (!expected || expected.length < 8) return false; // fail closed if misconfigured
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(given).digest();
  return timingSafeEqual(a, b);
}
