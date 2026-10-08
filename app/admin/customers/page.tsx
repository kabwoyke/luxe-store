import type { Metadata } from "next";
import { CustomersTab } from "@/components/admin/customers-tab";

export const metadata: Metadata = { title: "Admin: Customers", robots: { index: false, follow: false } };

export default function Page() {
  return <CustomersTab />;
}
