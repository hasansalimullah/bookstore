"use client";
import { useState } from "react";
import { CONTACT_SUBJECTS } from "@/lib/contact";

const EMPTY = { name: "", email: "", subject: "General question", orderRef: "", message: "", website: "" };

export default function ContactForm() {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setDone(true);
      else {
        setError(d.error ?? "Something went wrong.");
        setFields(d.fields ?? {});
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (done)
    return (
      <div className="cf-done">
        <h2>Thank you!</h2>
        <p>Your message has been sent. We usually reply within 1–2 working days, in sha Allah.</p>
      </div>
    );

  return (
    <form className="cf-form" onSubmit={submit} noValidate>
      <div className="cf-row">
        <label>Full name *<input value={f.name} onChange={set("name")} autoComplete="name" />{fields.name && <em>{fields.name}</em>}</label>
        <label>Email *<input type="email" value={f.email} onChange={set("email")} autoComplete="email" />{fields.email && <em>{fields.email}</em>}</label>
      </div>
      <div className="cf-row">
        <label>Subject *
          <select value={f.subject} onChange={set("subject")}>{CONTACT_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select>
          {fields.subject && <em>{fields.subject}</em>}
        </label>
        <label>Order number (optional)<input value={f.orderRef} onChange={set("orderRef")} /></label>
      </div>
      <label>Message *<textarea rows={7} value={f.message} onChange={set("message")} />{fields.message && <em>{fields.message}</em>}</label>
      <input className="cf-hp" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={f.website} onChange={set("website")} />
      {error && <p className="cf-err">{error}</p>}
      <button disabled={busy}>{busy ? "SENDING…" : "SEND MESSAGE"}</button>
    </form>
  );
}