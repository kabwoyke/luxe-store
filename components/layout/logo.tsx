import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="LUXESTORE home"
      className={cn("font-display text-2xl font-bold tracking-tight", className)}
    >
      <span className={onDark ? "text-white" : "text-ink"}>LUXE</span>
      <span className={onDark ? "text-pink-200" : "text-plum-soft"}>STORE</span>
    </Link>
  );
}
