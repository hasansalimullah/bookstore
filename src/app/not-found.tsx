import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "120px 24px", textAlign: "center", fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12 }}>Page not found</h1>
      <Link href="/" style={{ textDecoration: "underline", color: "#846a40" }}>Back to home</Link>
    </div>
  );
}
