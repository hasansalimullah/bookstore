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
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.replace("/admin");
    else setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "error");
  }

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">تسجيل دخول المدير</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="كلمة المرور"
        className="w-full rounded-lg border border-stone-300 px-3 py-2"
        autoFocus
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button onClick={submit} disabled={busy || !password} className="w-full rounded-lg bg-emerald-700 py-2 text-white disabled:opacity-50">
        دخول
      </button>
    </div>
  );
}
