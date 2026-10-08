import type { Metadata } from "next";
import { ProductsTab } from "@/components/admin/products-tab";

export const metadata: Metadata = { title: "Admin: Products", robots: { index: false, follow: false } };

export default function Page() {
  return <ProductsTab />;
}
