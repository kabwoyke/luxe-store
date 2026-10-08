import type { Metadata } from "next";
import { OrdersTab } from "@/components/admin/orders-tab";

export const metadata: Metadata = { title: "Admin: Orders", robots: { index: false, follow: false } };

export default function Page() {
  return <OrdersTab />;
}
