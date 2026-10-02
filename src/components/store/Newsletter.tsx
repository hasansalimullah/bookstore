"use client";
import { useState } from "react";
import { site } from "@/content/site";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Thank you! You are subscribed." : d.error ?? "Something went wrong.");
      if (res.ok) setEmail("");
    } catch {
      setMsg("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <section className="sf-news sf-pattern">
      <h2>{site.newsletter.heading}</h2>
      <p className="note">{site.newsletter.note}</p>
      <form onSubmit={submit}>
        <input type="email" required placeholder="Enter Your Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <button disabled={busy}>SUBSCRIBE</button>
      </form>
      {msg && <p className="msg">{msg}</p>}
    </section>
  );
}
