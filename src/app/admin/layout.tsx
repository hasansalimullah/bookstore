import type { Metadata } from "next";
import Link from "next/link";
import "../admin.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="ad-root">
      <div className="ad-header">
        <Link href="/admin" className="logo" aria-label="Admin">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="" />
        </Link>
        <div className="title">Admin Panel</div>
      </div>
      {children}
      <div className="ad-foot">© {process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books"} - {new Date().getFullYear()}. All rights reserved.</div>
    </div>
  );
}
