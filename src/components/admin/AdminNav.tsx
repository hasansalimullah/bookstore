"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const path = usePathname() ?? "";
  const router = useRouter();
  const on = (k: string) =>
    k === "books" ? path === "/admin" || path.startsWith("/admin/authors") || path.startsWith("/admin/books")
    : k === "import" ? path.startsWith("/admin/import")
    : k === "orders" ? path.startsWith("/admin/orders")
    : path.startsWith("/admin/test");
  const cls = (k: string) => (on(k) ? "on" : "");
  return (
    <nav className="ad-nav" aria-label="Admin">
      <div className="links">
        <Link href="/admin" className={cls("books")}>Books</Link>
        <Link href="/admin/import" className={cls("import")}>Import</Link>
        <Link href="/admin/orders" className={cls("orders")}>Orders</Link>
        <Link href="/admin/test" className={cls("test")}>Test / Simulation</Link>
        <Link href="/" target="_blank">View site ↗</Link>
      </div>
      <button
        className="out"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          router.replace("/admin/login");
        }}
      >
        Log out
      </button>
    </nav>
  );
}
