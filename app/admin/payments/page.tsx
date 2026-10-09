import type { Metadata } from "next";
import { PaymentsTab } from "@/components/admin/payments-tab";

export const metadata: Metadata = { title: "Admin: Payments", robots: { index: false, follow: false } };

export default function Page() {
  return <PaymentsTab />;
}
