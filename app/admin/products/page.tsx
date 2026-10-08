import type { Metadata } from "next";
import { ProductsTab } from "@/components/admin/products-tab";

export const metadata: Metadata = { title: "Products | LUXESTORE admin" };

export default function Page() {
  return <ProductsTab />;
}
