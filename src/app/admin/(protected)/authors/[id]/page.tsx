import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/authors";
import { listAdminBooksByAuthor } from "@/lib/books";
import AuthorBooks from "@/components/admin/AuthorBooks";
import AuthorTools from "@/components/admin/AuthorTools";

export const dynamic = "force-dynamic";

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const isNone = raw === "none";
  const id = Number(raw);
  const author = isNone ? null : Number.isInteger(id) ? await getAuthor(id) : null;
  if (!isNone && !author) notFound();
  const books = await listAdminBooksByAuthor(isNone ? "none" : id);
  return (
    <div className="ad-wrap wide">
      <p className="ad-crumb" style={{ marginTop: 34 }}><Link href="/admin">Authors</Link> / Books</p>
      <h1 className="ad-h1">{isNone ? "No author" : author!.name}</h1>
      {!isNone && <AuthorTools id={author!.id} name={author!.name} />}
      <div style={{ height: 18 }} />
      <AuthorBooks books={JSON.parse(JSON.stringify(books))} />
    </div>
  );
}
