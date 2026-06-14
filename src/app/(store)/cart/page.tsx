import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review selected Sukajan items before checkout."
};

export default function CartPage() {
  return <CartView />;
}
