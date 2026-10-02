"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthorsGrid({ authors, unassigned }: { authors: { id: number; name: string; books: number }[]; unassigned: number }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setErr(null);
    const res = await fetch("/api/admin/authors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(d.error ?? "error");
    setName("");
    setAdding(false);
    router.refresh();
  }

  return (
    <>
      <h3 className="ad-h3">Authors</h3>
      <div className="ad-tiles">
        {authors.map((a) => (
          <Link key={a.id} href={`/admin/authors/${a.id}`} className="ad-tile" title={`${a.books} book${a.books === 1 ? "" : "s"}`}>{a.name}</Link>
        ))}
        {unassigned > 0 && <Link href="/admin/authors/none" className="ad-tile muted">No author ({unassigned})</Link>}
        {adding ? (
          <div className="ad-addauthor">
            <input className="ad-input" autoFocus placeholder="Author name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="ad-btn md" onClick={add} disabled={!name.trim()}>Add</button>
            <button className="ad-btn grey md" onClick={() => { setAdding(false); setErr(null); }}>Cancel</button>
            {err && <span style={{ color: "#b3261e", fontSize: 13 }}>{err}</span>}
          </div>
        ) : (
          <button className="ad-plus" aria-label="Add author" onClick={() => setAdding(true)}>+</button>
        )}
      </div>
    </>
  );
}
