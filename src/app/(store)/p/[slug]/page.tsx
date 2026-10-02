import { notFound } from "next/navigation";
import { infoPages, site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: infoPages[slug] ?? "Page" };
}

// Placeholder pages for the footer links until their designs/content are ready.
export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const title = infoPages[slug];
  if (!title) notFound();
  return (
    <div className="sf-page">
      <h1>{title}</h1>
      <p style={{ color: "#555", lineHeight: 1.7 }}>
        This page is coming soon.{slug === "contact-us" ? <> In the meantime, email us at <a href={`mailto:${site.contact.email}`} style={{ textDecoration: "underline" }}>{site.contact.email}</a>.</> : null}
      </p>
    </div>
  );
}
