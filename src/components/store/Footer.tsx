import Link from "next/link";
import { site } from "@/content/site";
import { InstagramIcon, MailIcon, PinIcon, TikTokIcon } from "./icons";

export default function Footer() {
  const f = site.footer;
  return (
    <footer className="sf-footer">
      <div className="sf-footer-in">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/assets/logo.png" alt={site.name} />
          <div className="contact">
            <span style={{ display: "flex", gap: 4, alignItems: "center" }}><MailIcon /> {site.contact.email}</span>
            {f.address && <span style={{ display: "flex", gap: 4 }}><span style={{ filter: "invert(1)" }}><PinIcon /></span> {f.address}</span>}
          </div>
          <p className="deliver">{f.deliver}</p>
          <div className="social">
            {f.social.tiktok && <a href={f.social.tiktok} aria-label="TikTok"><TikTokIcon /></a>}
            {f.social.instagram && <a href={f.social.instagram} aria-label="Instagram"><InstagramIcon /></a>}
          </div>
          {f.rating && <div className="rating"><i /> {f.rating.score}</div>}
        </div>
        {f.columns.map((c) => (
          <div key={c.title}>
            <h4>{c.title}</h4>
            <ul>{c.links.map((l) => <li key={l.label}><Link href={l.href}>{l.label}</Link></li>)}</ul>
          </div>
        ))}
        <div className="about">
          <b>{f.aboutTitle}</b>
          {f.aboutText}
        </div>
      </div>
      <div className="sf-copy">{f.copyright}</div>
    </footer>
  );
}
