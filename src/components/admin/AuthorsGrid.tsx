"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DebugPanel from "./DebugPanel";
import DeleteAuthorModal from "./DeleteAuthorModal";

interface AuthorRow {
  id: number;
  name: string;
  books: number;
}

export default function AuthorsGrid({ authors, unassigned }: { authors: AuthorRow[]; unassigned: number }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [del, setDel] = useState<AuthorRow | null>(null);
  const [busy, setBusy] = useState<"check" | "test" | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [out, setOut] = useState<{ title: string; text: string } | null>(null);

  async function add() {
    setErr(null);
    const res = await fetch("/api/admin/authors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(d.error ?? "error");
    setName("");
    setAdding(false);
    router.refresh();
  }

  const post = (url: string, body: unknown = {}) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json().catch(() => ({})));

  /** Runs one request per book, one after another (polite to the supplier site), with live progress. */
  async function runAll(kind: "check" | "test") {
    setBusy(kind);
    setOut(null);
    const title = kind === "check" ? "Debug — Check All Authors Books Now (admin only)" : "Debug — Test All Authors Books Connection (admin only)";
    try {
      const list = ((await fetch("/api/admin/books").then((r) => r.json())) as { books?: { id: number; slug: string }[] }).books ?? [];
      if (!list.length) {
        setOut({ title, text: "No books yet." });
        return;
      }
      const lines: string[] = [];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        setProgress(`${kind === "check" ? "Checking" : "Testing"} ${i + 1} of ${list.length}…`);
        if (kind === "check") {
          const d = await post(`/api/admin/books/${b.id}/check`);
          const e = d.evaluation ?? {};
          lines.push(`#${b.id}  ${b.slug}  ${e.parsedStatus ?? "ERROR"}  (HTTP ${d.fetch?.httpStatus ?? "—"})${e.errorMessage ? "  " + e.errorMessage : ""}`);
        } else {
          const d = await post("/api/admin/test-connection", { bookId: b.id });
          lines.push(`#${b.id}  ${b.slug}  HTTP ${d.httpStatus ?? "—"}  selector ${d.selectorFound ? "yes" : "no"}  → ${d.parsedStatus ?? "ERROR"}${d.errorMessage ? "  " + d.errorMessage : ""}`);
        }
        setOut({ title, text: lines.join("\n") });
      }
      if (kind === "check") router.refresh();
    } finally {
      setProgress(null);
      setBusy(null);
    }
  }

  return (
    <>
      <h3 className="ad-h3">Authors</h3>
      <div className="ad-tiles">
        {authors.map((a) => (
          <div key={a.id} className="ad-tilewrap">
            <Link href={`/admin/authors/${a.id}`} className="ad-tile" title={`${a.books} book${a.books === 1 ? "" : "s"}`}>{a.name}</Link>
            <button className="ad-x" aria-label={`Delete ${a.name}`} title="Delete author" onClick={() => setDel(a)}>x</button>
          </div>
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

      <hr className="ad-rule" />
      <div className="ad-bulk">
        <button className="ad-btn bulk" disabled={!!busy} onClick={() => runAll("check")}>{busy === "check" ? "Checking…" : "Check All Authors Books Now"}</button>
        <button className="ad-btn grey bulk" disabled={!!busy} onClick={() => runAll("test")}>{busy === "test" ? "Testing…" : "Test All Authors Books Connection"}</button>
        {progress && <span className="ad-msg" style={{ margin: 0 }}>{progress}</span>}
      </div>
      {out && (
        <>
          <h2 className="ad-h2">{out.title}</h2>
          <DebugPanel text={out.text} />
        </>
      )}

      {del && (
        <DeleteAuthorModal
          author={del}
          books={del.books}
          onClose={() => setDel(null)}
          onDeleted={() => {
            setDel(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}