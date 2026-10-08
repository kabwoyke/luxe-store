import type { Metadata } from "next";
import { OverviewTab } from "@/components/admin/overview-tab";

export const metadata: Metadata = { title: "Admin: Overview", robots: { index: false, follow: false } };

export default function Page() {
  return <OverviewTab />;
}
