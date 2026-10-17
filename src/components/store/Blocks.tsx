import Link from "next/link";
import { site } from "@/content/site";
import { ArrowUpRight } from "./icons";

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
    <section className="sf-contact sf-pattern">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src="/assets/logo.png" alt={site.name} />
      <h2>{c.heading[0]}<br />{c.heading[1]}</h2>
      <p>{c.text[0]}<br />{c.text[1]}</p>
      <Link className="btn" href="/contact">{c.button}</Link>
    </section>
  );
}

export function Stats() {
  return (
    <section className="sf-stats-sec">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="decor l" src="/assets/decor-left.png" alt="" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="decor r" src="/assets/decor-right.png" alt="" aria-hidden />
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
    </section>
  );
}