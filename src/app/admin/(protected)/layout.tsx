import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

// Server-side guard: unauthenticated visitors never receive any admin HTML.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div dir="ltr" className="text-left">
      <div className="mb-6 flex items-center justify-between rounded-lg bg-stone-800 px-4 py-2 text-sm text-white">
        <nav className="flex gap-4">
          <Link href="/admin">Books</Link>
          <Link href="/admin/test">Test / Simulation</Link>
          <Link href="/" target="_blank">View site ↗</Link>
        </nav>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
