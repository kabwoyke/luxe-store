import { cn } from "@/lib/utils";

/** Tables never widen the page: they scroll sideways inside this box. */
export function TableBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-x-auto rounded-3xl border border-border bg-white", className)} tabIndex={0} role="region" aria-label="Table, scrolls sideways">
      {children}
    </div>
  );
}

export const th = "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-ink";
export const td = "px-4 py-3 align-top text-sm text-body";

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warn" }) {
  return (
    <div className={cn("rounded-3xl border bg-white p-5", tone === "warn" ? "border-amber-300 bg-amber-50" : "border-border")}>
      <p className="micro-label text-muted-ink">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-ink">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
      {error instanceof Error ? error.message : "Something went wrong."}
    </p>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="h-40 animate-pulse rounded-3xl bg-blush" role="status" aria-label={label} />
  );
}
