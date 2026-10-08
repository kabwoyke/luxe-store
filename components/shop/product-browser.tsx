"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import type { CardProduct } from "@/lib/card-product";
import { activeFilterCount, applyFilters, buildFilterGroups, type Selection } from "@/lib/filters";
import { textMatchesQuery } from "@/lib/product-options";
import { ProductCard } from "./product-card";
import { FilterPanel } from "./filter-panel";

type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const SORTERS: Record<Sort, (a: CardProduct, b: CardProduct) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.bestSeller) - Number(a.bestSeller),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

export function ProductBrowser({
  products,
  searchable = false,
  emptyMessage = "No products found.",
}: {
  products: CardProduct[];
  /** Show a text box that filters the products on screen. */
  searchable?: boolean;
  emptyMessage?: string;
}) {
  const [selection, setSelection] = useState<Selection>({});
  const [sort, setSort] = useState<Sort>("featured");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const groups = useMemo(() => buildFilterGroups(products), [products]);
  const activeCount = activeFilterCount(selection);

  const visible = useMemo(() => {
    const searched = query.trim() ? products.filter((p) => textMatchesQuery(p.searchText, query)) : products;
    return [...applyFilters(searched, selection)].sort(SORTERS[sort]);
  }, [products, query, selection, sort]);

  const toggle = (key: string, value: string) =>
    setSelection((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white text-sm font-semibold text-ink lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filter by details{activeCount > 0 && ` (${activeCount})`}
        </button>
        <div id="filter-panel" className={`${filtersOpen ? "mt-3 block" : "hidden"} lg:block`}>
          <FilterPanel
            groups={groups}
            selection={selection}
            onToggle={toggle}
            onClear={() => setSelection({})}
            activeCount={activeCount}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-ink" aria-live="polite">
            {visible.length} {visible.length === 1 ? "product" : "products"}
          </p>
          <div className="flex gap-2">
            {searchable && (
              <div className="relative flex-1 sm:w-64">
                <label htmlFor="browser-search" className="sr-only">
                  Search these products
                </label>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
                <input
                  id="browser-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="h-10 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm focus:border-mauve focus:outline-none"
                />
              </div>
            )}
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 rounded-full border border-border bg-white px-4 text-sm text-body focus:border-mauve focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <p className="font-heading text-lg font-semibold text-ink">{emptyMessage}</p>
            {(activeCount > 0 || query) && (
              <button
                type="button"
                onClick={() => {
                  setSelection({});
                  setQuery("");
                }}
                className="mt-3 text-sm font-semibold text-mauve hover:text-mauve-dark"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
