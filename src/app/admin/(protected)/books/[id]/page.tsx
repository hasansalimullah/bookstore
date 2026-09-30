import { notFound } from "next/navigation";
import { getAdminBook } from "@/lib/books";
import BookEditor from "@/components/admin/BookEditor";

export const dynamic = "force-dynamic";

export default async function AdminBookPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const book = Number.isInteger(id) ? await getAdminBook(id) : null;
  if (!book) notFound();
  return <BookEditor initial={book} />;
}
