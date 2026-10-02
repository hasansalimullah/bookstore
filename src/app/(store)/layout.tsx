import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-root">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
