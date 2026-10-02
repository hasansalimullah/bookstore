"use client";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon } from "./icons";

export default function CartIconLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" aria-label="Cart">
      <BagIcon />
      {ready && count > 0 ? <span className="sf-badge">{count}</span> : null}
    </Link>
  );
}
