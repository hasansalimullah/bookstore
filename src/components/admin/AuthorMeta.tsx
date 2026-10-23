"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: number;
  eras: string[];
  tags: { key: string; label: string }[];
  initial: { era: string | null; tags: string[]; featured: boolean };
}

/** Where this author appears in the header "Authors" menu. */
export default function AuthorMeta({ id, eras, tags, initial }: Props) {
  const router = useRouter();
  const [era, setEra] = useState(initial.era ?? "");
  const [sel, setSel] = useState<string[]>(initial.tags);
  const [featured, setFeatured] = useState(initial.featured);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/authors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ era, tags: sel, featured }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "Saved ✓ (the menu updates within 5 minutes)" : d.error ?? "Could not save");
    if (res.ok) router.refresh();
  }

  return (
    <section className="ad-panel" style={{ marginTop: 14, maxWidth: 760 }}>
      <h2 className="ad-h2" style={{ marginTop: 0 }}>Shown in the “Authors” menu</h2>
      <div style={{ display: "grid", gap: 14 }}>
        <label className="ad-label" style={{ textTransform: "none", fontSize: 13 }}>
          Century / area
          <select className="ad-input" value={era} onChange={(e) => setEra(e.target.value)}>
            <option value="">— not grouped —</option>
            {eras.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Groups (thematic order)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {tags.map((t) => (
              <label key={t.key} style={{ fontSize: 13.5, display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={sel.includes(t.key)} onChange={(e) => setSel(e.target.checked ? [...sel, t.key] : sel.filter((k) => k !== t.key))} />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <label style={{ fontSize: 13.5, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Show in “Top authors”
        </label>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="ad-btn md" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith("Saved") ? "#166a4c" : "#b3261e" }}>{msg}</span>}
        </div>
      </div>
    </section>
  );
}