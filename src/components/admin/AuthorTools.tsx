"use client";
import { useRouter } from "next/navigation";

export default function AuthorTools({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const link = { background: "none", border: 0, padding: 0, textDecoration: "underline", fontSize: 12.5, color: "#777" } as const;
  return (
    <div className="ad-pop" style={{ marginTop: 6, display: "flex", gap: 14 }}>
      <button
        style={link}
        onClick={async () => {
          const n = window.prompt("Rename author:", name);
          if (!n?.trim() || n.trim() === name) return;
          const res = await fetch(`/api/admin/authors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) });
          if (res.ok) router.refresh();
          else window.alert(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not rename");
        }}
      >
        Rename author
      </button>
      <button
        style={link}
        onClick={async () => {
          if (!window.confirm("Delete this author? Their books are kept (they just lose the author link).")) return;
          const res = await fetch(`/api/admin/authors/${id}`, { method: "DELETE" });
          if (res.ok) router.replace("/admin");
        }}
      >
        Delete author
      </button>
    </div>
  );
}
