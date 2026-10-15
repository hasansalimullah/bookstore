"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/format";

interface Msg {
  id: number;
  name: string;
  email: string;
  subject: string;
  orderRef: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessageList({ initial }: { initial: Msg[] }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState(initial);

  async function setRead(m: Msg, read: boolean) {
    setMsgs((x) => x.map((y) => (y.id === m.id ? { ...y, isRead: read } : y)));
    await fetch(`/api/admin/messages/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read }) });
    router.refresh();
  }
  async function del(m: Msg) {
    if (!window.confirm("Delete this message?")) return;
    setMsgs((x) => x.filter((y) => y.id !== m.id));
    await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (!msgs.length) return <p style={{ marginTop: 20, color: "#777" }}>No messages yet.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
      {msgs.map((m) => (
        <article key={m.id} className="ad-card white" style={{ padding: "14px 18px", borderColor: m.isRead ? "#ddd" : "#bc9353", borderWidth: m.isRead ? 1 : 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <b>{m.name}</b> <span style={{ color: "#777" }}>&lt;{m.email}&gt;</span>
              <div style={{ fontSize: 13, color: "#555" }}>{m.subject}{m.orderRef ? ` · Order ${m.orderRef}` : ""} · {fmtDateTime(m.createdAt)}</div>
            </div>
            {!m.isRead && <span style={{ color: "#bc9353", fontWeight: 700, fontSize: 12 }}>NEW</span>}
          </div>
          <p dir="auto" style={{ whiteSpace: "pre-wrap", margin: "10px 0 12px", fontSize: 14.5, lineHeight: "23px" }}>{m.message}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="ad-btn md" style={{ display: "inline-flex", alignItems: "center" }} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}>Reply by email</a>
            <button className="ad-btn grey md" onClick={() => setRead(m, !m.isRead)}>{m.isRead ? "Mark as unread" : "Mark as read"}</button>
            <button className="ad-btn red md" onClick={() => del(m)}>Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}