import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/lib/session";

/**
 * Authoritative admin check. proxy.ts already turns non-admins away early,
 * but this re-reads the user from the database, so a demoted admin loses access immediately.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-7xl animate-pulse px-4 py-10" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  if (!user.isAdmin) notFound();
  return <AdminShell>{children}</AdminShell>;
}
