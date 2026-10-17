import Link from "next/link";
import { site } from "@/content/site";
import { InstagramIcon, FacebookIcon, XIcon, TikTokIcon, MailIcon, PinIcon, StarsRow } from "./icons";

const SOCIAL: { key: string; label: string; Icon: () => React.ReactNode }[] = [
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
];

export default function Footer() {
  const f = site.footer;
  return (
    <footer className="sf-footer">
      <div className="sf-footer-in">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/assets/logo.png" alt={site.name} />
          <div className="contact">
            <a href={`mailto:${site.contact.email}`} style={{ display: "flex", gap: 6, alignItems: "center" }}><MailIcon /> {site.contact.email}</a>
            {f.address && <span style={{ display: "flex", gap: 6, alignItems: "flex-start" }}><span style={{ filter: "invert(1)", marginTop: 2 }}><PinIcon /></span> {f.address}</span>}
          </div>
          <p className="deliver">{f.deliver}</p>
          <div className="social">
            {SOCIAL.filter((s) => f.social[s.key]).map((s) => (
              <a key={s.key} href={f.social[s.key]} aria-label={s.label} target="_blank" rel="noopener noreferrer"><s.Icon /></a>
            ))}
          </div>
          {f.rating && <div className="rating"><StarsRow /> {f.rating.score}</div>}
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