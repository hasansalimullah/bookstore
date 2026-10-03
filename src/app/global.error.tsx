"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>Something went wrong</h1>
        <p style={{ color: "#555", marginBottom: 6 }}>Please refresh the page. If it keeps happening, send the site owner this code:</p>
        <p style={{ fontFamily: "monospace", marginBottom: 20 }}>{error.digest ?? "no code"}</p>
        <button onClick={() => reset()} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #999", background: "#fff", cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}