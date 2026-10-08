import type { Metadata } from "next";
import { SettingsTab } from "@/components/admin/settings-tab";

export const metadata: Metadata = { title: "Admin: Settings", robots: { index: false, follow: false } };

export default function Page() {
  return <SettingsTab />;
}
