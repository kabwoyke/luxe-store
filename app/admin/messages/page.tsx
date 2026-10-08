import type { Metadata } from "next";
import { MessagesTab } from "@/components/admin/messages-tab";

export const metadata: Metadata = { title: "Admin: Messages", robots: { index: false, follow: false } };

export default function Page() {
  return <MessagesTab />;
}
