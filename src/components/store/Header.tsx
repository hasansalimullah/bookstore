import Link from "next/link";
import { site } from "@/content/site";
import { config } from "@/lib/config";
import Topbar from "./Topbar";
import CartIconLink from "./CartIconLink";
import MegaNav from "./MegaNav";
import SearchBox from "./SearchBox";
import { HeartIcon, UserIcon } from "./icons";

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
            <Link href="/p/login" aria-label="Account"><UserIcon /></Link>
            <Link href="/p/wishlist" aria-label="Wishlist"><HeartIcon /></Link>
            <CartIconLink />
          </div>
        </div>
        <MegaNav items={site.nav} currency={config.currency} />
      </header>
    </>
  );
}