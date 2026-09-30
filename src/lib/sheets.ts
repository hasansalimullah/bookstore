// Turns a normal Google Sheets link into its CSV export link. Pure → unit-tested.
const ID_RE = /^[A-Za-z0-9_-]{10,}$/;

export function toSheetCsvUrl(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.hostname !== "docs.google.com") return null;
  const gid = u.searchParams.get("gid") ?? u.hash.match(/gid=(\d+)/)?.[1] ?? "0";
  if (!/^\d+$/.test(gid)) return null;

  // "Published to the web" link: /spreadsheets/d/e/<id>/pub?...
  const pub = u.pathname.match(/^\/spreadsheets\/d\/e\/([A-Za-z0-9_-]+)\/pub/);
  if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?gid=${gid}&single=true&output=csv`;

  const m = u.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if (!m || !ID_RE.test(m[1])) return null;
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

/** Only Google hosts may be fetched (also checked after redirects). */
export function isGoogleHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "docs.google.com" || h.endsWith(".google.com") || h.endsWith(".googleusercontent.com");
}
