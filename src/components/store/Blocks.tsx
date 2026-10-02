import Link from "next/link";
import { site } from "@/content/site";
import { ArrowUpRight } from "./icons";

export function Promos() {
  return (
    <div className="sf-promos">
      {site.promos.map((p, i) => (
        <div key={i} className="sf-promo sf-pattern">
          <h3>{p.title}</h3>
          <p>{p.text}</p>
          <Link href={p.href} className="btn">{p.button}</Link>
          {p.image && (
            <div className="pic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LinkButtons() {
  return (
    <div className="sf-links">
      {site.linkButtons.map((l, i) => (
        <Link key={i} href={l.href} className="sf-linkbtn sf-pattern">
          <span>{l.label}</span>
          <span className="go"><ArrowUpRight /></span>
        </Link>
      ))}
    </div>
  );
}

export function ContactBlock() {
  const c = site.contact;
  return (
    <div className="sf-contact sf-pattern">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src="/assets/logo.png" alt={site.name} />
      <h2>{c.heading[0]}<br />{c.heading[1]}</h2>
      <p>{c.text[0]}<br />{c.text[1]}</p>
      <a className="btn" href={`mailto:${c.email}`}>{c.button}</a>
    </div>
  );
}

export function Stats() {
  return (
    <div style={{ position: "relative", left: -11 }}>
      <h2 className="sf-stats-h">{site.statsHeading[0]}<br />{site.statsHeading[1]}</h2>
      <div className="sf-stats">
        {site.stats.map((s, i) => (
          <div key={i} className="sf-stat">
            <div className="box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.icon} alt="" />
            </div>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
