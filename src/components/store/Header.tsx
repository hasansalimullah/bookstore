import Link from "next/link";
import { site } from "@/content/site";
import Topbar from "./Topbar";
import CartIconLink from "./CartIconLink";
import { HeartIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";

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
          <form action="/shop" className="sf-search" role="search">
            <SearchIcon />
            <input name="q" placeholder="Search by title, Author, Keyword..." aria-label="Search" />
          </form>
          <div className="sf-icons">
            <Link href="/p/login" aria-label="Account"><UserIcon /></Link>
            <Link href="/p/wishlist" aria-label="Wishlist"><HeartIcon /></Link>
            <CartIconLink />
          </div>
        </div>
        <nav className="sf-nav" aria-label="Main">
          <Link href="/" className="home" aria-label="Home"><HomeIcon /></Link>
          {site.nav.map((n, i) => (
            <span key={n.label}>
              {i > 0 && <span className="sep">|</span>}
              <Link href={n.href} className={n.active ? "active" : ""}>{n.label}</Link>
            </span>
          ))}
        </nav>
      </header>
    </>
  );
}
