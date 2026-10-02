import CartView from "@/components/cart/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return <div className="mx-auto max-w-5xl px-4 py-10" style={{ fontFamily: "var(--font-poppins), sans-serif" }}><CartView /></div>;
}
