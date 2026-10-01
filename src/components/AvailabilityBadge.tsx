export type Availability = "available" | "out_of_stock" | "unknown";

const MAP: Record<Availability, { icon: string; text: string; cls: string }> = {
  available: { icon: "🟢", text: "In stock", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  out_of_stock: { icon: "🔴", text: "Out of stock", cls: "bg-red-50 text-red-800 border-red-200" },
  unknown: { icon: "🟡", text: "Checking availability…", cls: "bg-amber-50 text-amber-800 border-amber-200" },
};

export default function AvailabilityBadge({ value, className = "" }: { value: Availability; className?: string }) {
  const m = MAP[value] ?? MAP.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${m.cls} ${className}`}>
      <span aria-hidden>{m.icon}</span>
      <span>{m.text}</span>
    </span>
  );
}
