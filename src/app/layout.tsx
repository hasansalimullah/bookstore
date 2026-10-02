import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Oswald, Poppins } from "next/font/google";
import "./globals.css";
import "./store.css";
import { CartProvider } from "@/components/cart/CartProvider";

const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "Ahlul Ilm Books";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--font-arabic", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal"], variable: "--font-oswald", display: "swap" });

export const metadata: Metadata = {
  title: { default: SITE, template: `%s | ${SITE}` },
  description: "Arabic Islamic books, delivered worldwide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" translate="no" suppressHydrationWarning className={`${poppins.variable} ${arabic.variable} ${oswald.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
