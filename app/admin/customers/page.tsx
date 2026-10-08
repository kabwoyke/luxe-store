import type { Metadata } from "next";
import { CustomersTab } from "@/components/admin/customers-tab";

export const metadata: Metadata = { title: "Customers | LUXESTORE admin" };

export default function Page() {
  return <CustomersTab />;
}
