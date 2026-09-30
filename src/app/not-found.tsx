import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <Link href="/" className="text-emerald-700 underline">Back to home</Link>
    </div>
  );
}
