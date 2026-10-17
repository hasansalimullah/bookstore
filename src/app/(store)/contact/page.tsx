import type { Metadata } from "next";
import { site } from "@/content/site";
import ContactForm from "@/components/store/ContactForm";
import { MailIcon, PinIcon } from "@/components/store/icons";

export const metadata: Metadata = { title: "Contact us", description: "Questions about a book, an order or shipping? Send us a message." };

export default function ContactPage() {
  const c = site.contact;
  return (
    <div className="cf-page">
      <h1>CONTACT US</h1>
      <div className="rule" />
      <p className="lead">Questions about a book, an order or shipping? Send us a message and we&apos;ll get back to you.</p>
      <div className="cf-grid">
        <aside className="cf-info sf-pattern">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt={site.name} />
          <h2>Get in touch</h2>
          <p><MailIcon /> <a href={`mailto:${c.email}`}>{c.email}</a></p>
          {site.footer.address && <p><span style={{ filter: "invert(1)" }}><PinIcon /></span> {site.footer.address}</p>}
          <p className="note">{site.footer.deliver}</p>
        </aside>
        <section className="cf-card">
          <ContactForm />
        </section>
      </div>
    </div>
  );
}