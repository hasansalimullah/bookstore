import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const csv =
    "Supplier product URL,Title,Author,Slug,Price,Image URL,Description\n" +
    '"https://example.com/product-link","Example Book","Example Author","example-book","24.99","https://example.com/cover.jpg","Short description"\n';
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="books-template.csv"' } });
}
