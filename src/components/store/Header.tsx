import Link from "next/link";
import { site } from "@/content/site";
import { config } from "@/lib/config";
import Topbar from "./Topbar";
import CartIconLink from "./CartIconLink";
import MegaNav from "./MegaNav";
import SearchBox from "./SearchBox";
import { UserIcon } from "./icons";
import WishlistLink from "./WishListLink";

export default function Header() {
  return (
    <>
      <Topbar country={site.country} messages={site.announcements} language={site.language} currency={site.currencyLabel} />
      <header className="sf-header">
        <div className="sf-header-in">
          <Link href="/" className="sf-logo" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt={site.name} width={152} height={34} />
          </Link>
          <SearchBox currency={config.currency} />
          <div className="sf-icons">
            <Link href="/account" aria-label="Account"><UserIcon /></Link>
            <WishlistLink />
            <CartIconLink />
          </div>
        </div>
        <MegaNav items={site.nav} currency={config.currency} />
      </header>
    </>
  );
}