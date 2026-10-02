import { listAuthors } from "@/lib/authors";
import AddBookCard from "@/components/admin/AddBookCard";
import AuthorsGrid from "@/components/admin/AuthorsGrid";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const { authors, unassigned } = await listAuthors();
  return (
    <div className="ad-wrap" style={{ marginTop: 18 }}>
      <AddBookCard authors={authors.map((a) => ({ id: a.id, name: a.name }))} />
      <AuthorsGrid authors={authors} unassigned={unassigned} />
    </div>
  );
}
