import type { Metadata } from "next";
import { SettingsTab } from "@/components/admin/settings-tab";

export const metadata: Metadata = { title: "Settings | LUXESTORE admin" };

export default function Page() {
  return <SettingsTab />;
}
