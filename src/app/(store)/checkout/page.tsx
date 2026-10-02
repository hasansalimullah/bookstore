import CheckoutForm from "@/components/cart/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <div className="mx-auto max-w-5xl px-4 py-10" style={{ fontFamily: "var(--font-poppins), sans-serif" }}><CheckoutForm /></div>;
}
