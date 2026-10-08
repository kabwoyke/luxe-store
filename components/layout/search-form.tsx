import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchForm({
  className,
  id = "site-search",
}: {
  className?: string;
  id?: string;
}) {
  return (
    <form action="/search" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
        <Input
          id={id}
          name="q"
          type="search"
          placeholder="Search wigs, shoes, bags…"
          className="h-10 rounded-full border-border bg-white pl-10 text-sm"
        />
      </div>
    </form>
  );
}
