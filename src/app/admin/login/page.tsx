"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) router.replace("/admin");
    else setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "error");
  }

  return (
    <div className="ad-main">
      <div className="ad-card" style={{ maxWidth: 420, margin: "70px auto 0", width: "calc(100% - 32px)" }}>
        <h2 style={{ fontSize: 18, margin: "6px 0 14px" }}>Admin login</h2>
        <div className="ad-field">
          <label className="ad-label">Password</label>
          <input type="password" className="ad-input" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <p style={{ color: "#b3261e", fontSize: 14, marginBottom: 12 }}>{error}</p>}
        <button className="ad-btn md" style={{ width: "100%" }} onClick={submit} disabled={busy || !password}>Log in</button>
      </div>
    </div>
  );
}
