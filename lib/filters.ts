import type { CardProduct } from "@/lib/card-product";
import {
  CATEGORIES,
  productColorCss,
  variantColors,
  variantSizes,
} from "@/lib/product-options";

export type FilterOption = { value: string; count: number; css?: string };

export type FilterGroup = {
  key: string;
  label: string;
  kind: "swatch" | "pill" | "check";
  options: FilterOption[];
};

/** group key -> selected values */
export type Selection = Record<string, string[]>;

const ATTR_PREFIX = "attr:";

function count(values: (string | undefined)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

/**
 * Filter groups built from the products on screen: colour, size, type, and every
 * `filterable` attribute. Groups with fewer than two options are left out.
 */
export function buildFilterGroups(products: CardProduct[]): FilterGroup[] {
  const categories = [...new Set(products.map((p) => p.category))];
  const single = categories.length === 1 ? CATEGORIES[categories[0]] : undefined;
  const groups: FilterGroup[] = [];

  // Colour
  const colorCounts = count(products.flatMap((p) => variantColors(p.variants)));
  groups.push({
    key: "color",
    label: "Color",
    kind: "swatch",
    options: [...colorCounts].map(([value, n]) => {
      const owner = products.find((p) => variantColors(p.variants).includes(value))!;
      return { value, count: n, css: productColorCss(owner, value) };
    }),
  });

  // Size / length
  const sizeCounts = count(products.flatMap((p) => [...new Set(p.variants.map((v) => v.size))]));
  const allSizes = variantSizes(products.flatMap((p) => p.variants), single?.key);
  groups.push({
    key: "size",
    label: single ? single.sizeLabel : "Size",
    kind: "pill",
    options: allSizes.map((value) => ({ value, count: sizeCounts.get(value) ?? 0 })),
  });

  // Type (subcategory)
  const typeCounts = count(products.map((p) => p.subcategory));
  groups.push({
    key: "type",
    label: "Type",
    kind: "check",
    options: [...typeCounts].map(([value, n]) => ({ value, count: n })),
  });

  // Filterable attributes, in config order
  const seen = new Set<string>();
  for (const category of categories) {
    for (const attr of CATEGORIES[category]?.attributes ?? []) {
      if (!attr.filterable || seen.has(attr.key)) continue;
      seen.add(attr.key);
      const present = count(products.map((p) => p.attributes[attr.key]));
      const options = attr.options
        .filter((o) => present.has(o))
        .map((value) => ({ value, count: present.get(value)! }));
      groups.push({ key: ATTR_PREFIX + attr.key, label: attr.label, kind: "check", options });
    }
  }

  return groups.filter((g) => g.options.length >= 2);
}

function matches(product: CardProduct, key: string, selected: string[]): boolean {
  if (key === "color") return product.variants.some((v) => v.color && selected.includes(v.color));
  if (key === "size") return product.variants.some((v) => v.size && selected.includes(v.size));
  if (key === "type") return selected.includes(product.subcategory);
  const value = product.attributes[key.slice(ATTR_PREFIX.length)];
  return !!value && selected.includes(value);
}

/** OR within a group, AND between groups. */
export function applyFilters(products: CardProduct[], selection: Selection): CardProduct[] {
  const active = Object.entries(selection).filter(([, values]) => values.length > 0);
  if (active.length === 0) return products;
  return products.filter((p) => active.every(([key, values]) => matches(p, key, values)));
}

export function activeFilterCount(selection: Selection): number {
  return Object.values(selection).reduce((n, values) => n + values.length, 0);
}
