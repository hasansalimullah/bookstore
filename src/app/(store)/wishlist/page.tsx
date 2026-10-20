import { config } from "@/lib/config";
import WishlistView from "@/components/store/WishListView";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="sf-shop">
      <header className="sf-pagehead">
        <h1>WISHLIST</h1>
        <p>Books you saved with the ♡. They&apos;re kept on this device.</p>
      </header>
      <WishlistView currency={config.currency} />
    </div>
  );
}