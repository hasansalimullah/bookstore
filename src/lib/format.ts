export function fmtDateTime(iso: string | null | undefined, seconds = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const s = d.toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, seconds ? 19 : 16)} UTC`;
}

export function availabilityLabel(a: string): { text: string; cls: "ok" | "bad" | "wait" } {
  return a === "available" ? { text: "In stock ✓", cls: "ok" } : a === "out_of_stock" ? { text: "Out of stock X", cls: "bad" } : { text: "Checking…", cls: "wait" };
}

export function priceLabel(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : `$${(cents / 100).toFixed(2)}`;
}
