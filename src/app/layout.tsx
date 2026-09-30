import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books";

export const metadata: Metadata = {
  title: { default: SITE, template: `%s | ${SITE}` },
  description: "Islamic bookstore",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" translate="no" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold text-emerald-800">{SITE}</Link>
            <nav className="text-sm text-stone-600"><Link href="/">Books</Link></nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-stone-500">© {SITE}</footer>
      </body>
    </html>
  );
}
