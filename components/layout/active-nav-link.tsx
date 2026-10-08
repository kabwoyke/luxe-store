"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap text-sm font-medium transition-colors hover:text-mauve",
        active ? "text-mauve" : "text-body"
      )}
    >
      {children}
    </Link>
  );
}
