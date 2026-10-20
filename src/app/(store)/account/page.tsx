import AccountHub from "@/components/store/AccountHub";

export const metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <div className="sf-shop">
      <header className="sf-pagehead">
        <h1>YOUR ACCOUNT</h1>
        <p>Everything in one place. You don&apos;t need to sign in — your cart, wishlist and orders are kept on this device.</p>
      </header>
      <AccountHub />
    </div>
  );
}