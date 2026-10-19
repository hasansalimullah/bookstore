import { listDiscounts } from "@/lib/discount-db";
import DiscountManager from "@/components/admin/DiscountManager";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const codes = await listDiscounts();
  return (
    <div className="ad-wrap">
      <h1 className="ad-h1 plain" style={{ marginTop: 34 }}>Discount codes</h1>
      <DiscountManager initial={codes} />
    </div>
  );
}