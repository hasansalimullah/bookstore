"use client";
import { useEffect, useState } from "react";

export default function DeleteAuthorModal({
  author,
  books,
  onClose,
  onDeleted,
}: {
  author: { id: number; name: string };
  books?: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const expected = `delete_${author.name}`;
  const ok = typed.trim() === expected;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function confirmDelete() {
    if (!ok || busy) return;
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/admin/authors/${author.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDeleted();
    else setErr(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not delete the author");
  }

  return (
    <div className="ad-modal-bg" onMouseDown={onClose}>
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Delete author" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Are you sure?</h3>
        <p>
          You are about to delete the author <b dir="auto">{author.name}</b>.
          {books !== undefined && books > 0 ? <> Their <b>{books}</b> book{books === 1 ? "" : "s"} will <b>not</b> be deleted — they just lose the author link.</> : null}{" "}
          This can&apos;t be undone.
        </p>
        <p>To confirm, type this exactly:</p>
        <code dir="auto">{expected}</code>
        <input
          className="ad-input"
          dir="auto"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
          placeholder={expected}
        />
        {err && <p style={{ color: "#b3261e", fontSize: 13, margin: "10px 0 0" }}>{err}</p>}
        <div className="act">
          <button className="ad-btn grey md" onClick={onClose}>Cancel</button>
          <button className="ad-btn red md" disabled={!ok || busy} onClick={confirmDelete}>{busy ? "Deleting…" : "Delete author"}</button>
        </div>
      </div>
    </div>
  );
}