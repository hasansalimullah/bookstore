import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import CookieBanner from "@/components/store/CookieBanner";
import { site } from "@/content/site";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-root">
      <Header />
      <main>{children}</main>
      <Footer />
      <CookieBanner analyticsToken={site.analytics.cloudflareToken} />
    </div>
  );
}