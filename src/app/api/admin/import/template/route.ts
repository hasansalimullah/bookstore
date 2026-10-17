import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const csv =
    "Supplier product URL,Title,Title (Arabic),Author,Slug,Price,Category,Image URL,Image URL 2,Image URL 3,Description,Edition,Cover,Print Quality,Format,Harakat\n" +
    '"https://example.com/product-link","Example Book","كتاب مثال","Example Author","example-book","24.99","Fiqh & Ahkam > Fiqh Hanbali","https://example.com/1.jpg","https://example.com/2.jpg","","Short description","Dar Example","Hard","Premium Quality","17x24cm","Full"\n';
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="books-template.csv"' } });
}
