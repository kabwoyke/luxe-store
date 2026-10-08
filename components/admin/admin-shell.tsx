"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Settings", href: "/admin/settings" },
] as const;

/** Admin frame: the tab bar (scrolls sideways on phones) and the TanStack Query provider. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } } }));

  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="micro-label text-mauve">Admin</p>
        <h1 className="sr-only">Admin: {TABS.find((t) => (t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href)))?.label ?? "Dashboard"}</h1>
        <nav aria-label="Admin sections" className="no-scrollbar mt-2 mb-6 flex gap-1 overflow-x-auto rounded-full bg-blush p-1.5">
          {TABS.map((tab) => {
            const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors",
                  active ? "bg-white text-ink shadow-sm" : "text-muted-ink hover:text-mauve"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </QueryClientProvider>
  );
}
