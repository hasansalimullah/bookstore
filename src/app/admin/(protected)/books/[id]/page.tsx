import { notFound } from "next/navigation";
import { listAuthors } from "@/lib/authors";
import { getAdminBook } from "@/lib/books";
import BookEditor from "@/components/admin/BookEditor";

export const dynamic = "force-dynamic";

export default async function AdminBookPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const book = Number.isInteger(id) ? await getAdminBook(id) : null;
  if (!book) notFound();
  const { authors } = await listAuthors();
  return <BookEditor initial={JSON.parse(JSON.stringify(book))} authors={authors.map((a) => ({ id: a.id, name: a.name }))} />;
}
