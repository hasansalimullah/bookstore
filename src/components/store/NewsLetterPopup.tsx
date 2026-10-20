"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const KEY = "nl-popup-v1";
const REPEAT_MS = 14 * 24 * 3600 * 1000; // a visitor who closes it sees it again after 14 days
const SKIP = ["/cart", "/checkout", "/order", "/admin", "/contact"];

interface Props {
  enabled: boolean;
  delaySeconds: number;
  percent: number;
  code: string;
}

export default function NewsletterPopup({ enabled, delaySeconds, percent, code }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (!enabled || shown.current || SKIP.some((p) => path.startsWith(p))) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { state: string; at: number } | null;
      if (saved?.state === "subscribed") return;
      if (saved?.state === "closed" && Date.now() - saved.at < REPEAT_MS) return;
    } catch {
      /* ignore */
    }
    let poll: ReturnType<typeof setInterval> | null = null;
    const wait = setTimeout(() => {
      let tries = 0;
      poll = setInterval(() => {
        // show only after the visitor has answered the cookie banner, so two pop-ups never stack
        if (localStorage.getItem("consent-v1")) {
          if (poll) clearInterval(poll);
          shown.current = true;
          setOpen(true);
        } else if (++tries > 15 && poll) {
          clearInterval(poll); // banner still unanswered: skip the pop-up this time
        }
      }, 3000);
    }, Math.max(1, delaySeconds) * 1000);
    return () => {
      clearTimeout(wait);
      if (poll) clearInterval(poll);
    };
  }, [enabled, delaySeconds, path]);

  function close() {
    setOpen(false);
    if (!done) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ state: "closed", at: Date.now() }));
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, done]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setErr(d.error ?? "Something went wrong.");
      else {
        setDone(true);
        try {
          localStorage.setItem(KEY, JSON.stringify({ state: "subscribed", at: Date.now() }));
        } catch {
          /* ignore */
        }
      }
    } catch {
      setErr("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div className="sf-nlbg" onMouseDown={close}>
      <div className="sf-nl" role="dialog" aria-modal="true" aria-label="Newsletter" onMouseDown={(e) => e.stopPropagation()}>
        <button className="x" aria-label="Close" onClick={close}>×</button>
        <div className="form">
          {done ? (
            <>
              <h2>Thank you!</h2>
              <p>You&apos;re on the list. Here is your {percent}% code for your first order:</p>
              <div className="code">
                <b>{code}</b>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => {});
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="small">Enter it in your cart before checkout.</p>
              <button className="go" onClick={close}>START SHOPPING</button>
            </>
          ) : (
            <>
              <h2>Sign up and enjoy {percent}% off your first purchase</h2>
              <p>Discover the best of Islamic books — new arrivals and offers, straight to your inbox.</p>
              <form onSubmit={submit}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name here" autoComplete="given-name" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email here" autoComplete="email" />
                {err && <p className="err">{err}</p>}
                <button className="go" disabled={busy}>{busy ? "…" : "JOIN TODAY"}</button>
              </form>
              <p className="small">You can unsubscribe at any time.</p>
            </>
          )}
        </div>
        <div className="art" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="" />
          <b>{percent}%</b>
          <span>OFF YOUR FIRST ORDER</span>
        </div>
      </div>
    </div>
  );
}