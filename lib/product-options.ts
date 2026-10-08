/**
 * Single source of truth for categories, types, attributes, colours and sizes.
 * Used by the admin form, storefront, filters and search.
 */

export type ColorDef = { name: string; hex: string; hex2?: string };

export type AttributeDef = {
  key: string;
  label: string;
  options: string[];
  filterable?: boolean;
};

export type Variant = {
  id: string;
  color?: string;
  colorHex?: string;
  size?: string;
  stock: number;
  sku?: string;
};

/** The product fields the helpers below need; DB rows satisfy this. */
export type ProductLike = {
  name: string;
  description: string;
  shortDescription?: string | null;
  category: string;
  subcategory: string;
  brand?: string | null;
  tags: string[];
  imageUrl: string;
  images: string[];
  attributes: Record<string, string>;
  colorImages: Record<string, string[]>;
  variants: Variant[];
};

export type CategoryConfig = {
  key: string;
  label: string;
  types: string[];
  attributes: AttributeDef[];
  /** Label for the size dimension, e.g. "Length (inches)". */
  sizeLabel: string;
  /** Fixed size options, or null for free-text sizes/shades. */
  sizes: string[] | null;
  /** Preset colours. Empty means custom colours only. Custom is always allowed. */
  colors: ColorDef[];
  /** Attribute keys shown in the card subtitle, before the size range. */
  highlightKeys: string[];
};

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

const YES_NO = ["Yes", "No"];

export const CURLY_TEXTURES = ["Curly", "Bouncy Curl", "Kinky Curly", "Jerry Curl"];

const WIG_COLORS: ColorDef[] = [
  { name: "Natural Black", hex: "#1c1917" },
  { name: "Jet Black", hex: "#0a0a0a" },
  { name: "Dark Brown", hex: "#3b2417" },
  { name: "Chestnut Brown", hex: "#6b3e26" },
  { name: "Honey Blonde", hex: "#c9964a" },
  { name: "Platinum Blonde", hex: "#e8dcc0" },
  { name: "Ginger", hex: "#b5532a" },
  { name: "Auburn", hex: "#7a2e1d" },
  { name: "Burgundy", hex: "#5c1230" },
  { name: "Silver Grey", hex: "#b4b4b8" },
  { name: "Pink", hex: "#ec7fb0" },
  { name: "Ombre Brown", hex: "#2a1a12", hex2: "#a0693d" },
  { name: "Ombre Blonde", hex: "#2a1a12", hex2: "#e0bd78" },
];

const SHOE_COLORS: ColorDef[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#fafafa" },
  { name: "Beige", hex: "#d9c4a3" },
  { name: "Nude", hex: "#e0b9a0" },
  { name: "Tan", hex: "#b07a48" },
  { name: "Brown", hex: "#5a3a26" },
  { name: "Red", hex: "#c8202f" },
  { name: "Pink", hex: "#ec7fb0" },
  { name: "Navy", hex: "#1c2a4e" },
  { name: "Green", hex: "#2f6b45" },
  { name: "Gold", hex: "#c9a43b" },
  { name: "Silver", hex: "#bcbcc2" },
];

const BAG_COLORS: ColorDef[] = [
  { name: "Black", hex: "#111111" },
  { name: "Cognac Tan", hex: "#9a5a2c" },
  { name: "Brown", hex: "#5a3a26" },
  { name: "Camel", hex: "#c19a6b" },
  { name: "Cream", hex: "#f2e8d5" },
  { name: "White", hex: "#fafafa" },
  { name: "Burgundy", hex: "#5c1230" },
  { name: "Red", hex: "#c8202f" },
  { name: "Pink", hex: "#ec7fb0" },
  { name: "Navy", hex: "#1c2a4e" },
  { name: "Green", hex: "#2f6b45" },
  { name: "Gold", hex: "#c9a43b" },
];

const GENERAL = "General";

export const CATEGORIES: Record<string, CategoryConfig> = {
  Wigs: {
    key: "Wigs",
    label: "Hair & Wigs",
    types: [
      GENERAL, "Lace Front", "Full Lace", "Closure Wig", "Frontal Wig", "Glueless Wig",
      "U-Part Wig", "Bob Wig", "Headband Wig", "Bundles", "Ponytail", "Human Hair", "Synthetic",
    ],
    attributes: [
      { key: "hairType", label: "Hair type", filterable: true, options: ["Human Hair", "Virgin Human Hair", "Remy Human Hair", "Semi-Human Hair", "Synthetic"] },
      { key: "texture", label: "Texture", filterable: true, options: ["Straight", "Body Wave", "Loose Wave", "Deep Wave", "Water Wave", "Natural Wave", "Curly", "Bouncy Curl", "Kinky Curly", "Kinky Straight", "Jerry Curl"] },
      { key: "curly", label: "Curly", filterable: true, options: YES_NO },
      { key: "construction", label: "Construction", options: ["4x4 Closure", "5x5 Closure", "6x6 Closure", "13x4 Frontal", "13x6 Frontal", "360 Lace", "Full Lace", "U-Part", "Headband", "No Lace"] },
      { key: "laceType", label: "Lace type", options: ["HD Lace", "Transparent Lace", "Swiss Lace", "French Lace", "None"] },
      { key: "density", label: "Density", filterable: true, options: ["130%", "150%", "180%", "200%", "250%"] },
      { key: "glueless", label: "Glueless", options: YES_NO },
      { key: "capSize", label: "Cap size", options: ["Small", "Average", "Large"] },
    ],
    sizeLabel: "Length (inches)",
    sizes: range(8, 36, 2).map((n) => `${n}"`),
    colors: WIG_COLORS,
    highlightKeys: ["hairType", "texture"],
  },
  Shoes: {
    key: "Shoes",
    label: "Shoes & Heels",
    types: [GENERAL, "Heels", "Sneakers", "Boots", "Sandals", "Flats", "Loafers", "Slides"],
    attributes: [
      { key: "material", label: "Material", filterable: true, options: ["Leather", "Faux Leather", "Suede", "Canvas", "Satin", "Mesh", "Rubber"] },
      { key: "heelHeight", label: "Heel height", filterable: true, options: ["Flat", "Low (1-2 in)", "Mid (2-3 in)", "High (3-4 in)", "Platform"] },
      { key: "occasion", label: "Occasion", filterable: true, options: ["Casual", "Office", "Party", "Sports"] },
    ],
    sizeLabel: "Size (EU)",
    sizes: range(35, 46).map(String),
    colors: SHOE_COLORS,
    highlightKeys: ["material", "heelHeight"],
  },
  Handbags: {
    key: "Handbags",
    label: "Handbags & Totes",
    types: [GENERAL, "Totes", "Shoulder Bags", "Clutches", "Crossbody", "Backpacks"],
    attributes: [
      { key: "material", label: "Material", filterable: true, options: ["Leather", "Faux Leather", "Canvas", "Suede", "Straw", "Nylon"] },
      { key: "closure", label: "Closure", options: ["Zip", "Magnetic Snap", "Flap", "Drawstring"] },
      { key: "strap", label: "Strap", options: ["Top Handle", "Shoulder Strap", "Crossbody Strap", "Detachable Strap"] },
    ],
    sizeLabel: "Size",
    sizes: ["Mini", "Small", "Medium", "Large", "Extra Large"],
    colors: BAG_COLORS,
    highlightKeys: ["material", "strap"],
  },
  Cosmetics: {
    key: "Cosmetics",
    label: "Beauty & Makeup",
    types: [GENERAL, "Body Wash & Soaps", "Skin Care", "Hair Care", "Makeup", "Fragrance", "Beauty Tools"],
    attributes: [],
    sizeLabel: "Size / shade",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
  Accessories: {
    key: "Accessories",
    label: "Jewelry & Accessories",
    types: [GENERAL, "Jewelry", "Gold Hoops", "Hair Clips", "Sunglasses", "Watches"],
    attributes: [],
    sizeLabel: "Size",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
  Wellness: {
    key: "Wellness",
    label: "Self-Care & Wellness",
    types: [GENERAL, "Body Care", "Self Care", "Shower Infusions", "Botanical Oils", "Aromatherapy"],
    attributes: [],
    sizeLabel: "Size",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
  Makeup: {
    key: "Makeup",
    label: "Makeup",
    types: ["Lips", "Face", "Eyes", "Tools"],
    attributes: [],
    sizeLabel: "Shade",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
  Skincare: {
    key: "Skincare",
    label: "Skincare",
    types: ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Body Wash & Soaps"],
    attributes: [],
    sizeLabel: "Size",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
  Fragrance: {
    key: "Fragrance",
    label: "Fragrance",
    types: ["Perfume Oils", "Body Mist", "Gift Sets"],
    attributes: [],
    sizeLabel: "Size",
    sizes: null,
    colors: [],
    highlightKeys: [],
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export function getCategory(key: string): CategoryConfig | undefined {
  return CATEGORIES[key];
}

/* ---------- colours ---------- */

export function findPresetColor(category: string, name: string): ColorDef | undefined {
  return CATEGORIES[category]?.colors.find((c) => c.name === name);
}

/** CSS background for a swatch. Ombres become gradients; custom colours use their hex. */
export function colorCss(def: { hex?: string; hex2?: string } | undefined, fallback = "#d6c4cd"): string {
  if (!def?.hex) return fallback;
  return def.hex2 ? `linear-gradient(135deg, ${def.hex}, ${def.hex2})` : def.hex;
}

/** CSS for a colour on a given product: preset by name first, then the variant's own hex. */
export function productColorCss(product: Pick<ProductLike, "category" | "variants">, colorName: string): string {
  const preset = findPresetColor(product.category, colorName);
  if (preset) return colorCss(preset);
  const variant = product.variants.find((v) => v.color === colorName);
  return colorCss(variant?.colorHex ? { hex: variant.colorHex } : undefined);
}

/* ---------- variants ---------- */

export function sumVariantStock(variants: Variant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Deterministic id so a (color, size) pair is unique by construction. */
export function variantId(color?: string, size?: string): string {
  return ["v", color && slug(color), size && slug(size)].filter(Boolean).join("-");
}

/** Adds variants; an existing (color, size) pair gets its stock updated instead of duplicated. */
export function upsertVariants(existing: Variant[], incoming: Omit<Variant, "id">[]): Variant[] {
  const byId = new Map(existing.map((v) => [v.id, v]));
  for (const v of incoming) {
    const id = variantId(v.color, v.size);
    byId.set(id, { ...byId.get(id), ...v, id });
  }
  return [...byId.values()];
}

export function findVariant(variants: Variant[], color?: string, size?: string): Variant | undefined {
  return variants.find((v) => v.color === color && v.size === size);
}

export function variantLabel(v: Pick<Variant, "color" | "size">): string {
  return [v.color, v.size].filter(Boolean).join(" / ");
}

export function variantColors(variants: Variant[]): string[] {
  return [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))];
}

const sizeNumber = (s: string) => parseFloat(s.replace(/[^\d.]/g, ""));

export function variantSizes(variants: Variant[], category?: string): string[] {
  const unique = [...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))];
  const order = category ? CATEGORIES[category]?.sizes : null;
  if (order) return unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return unique.sort((a, b) => sizeNumber(a) - sizeNumber(b) || a.localeCompare(b));
}

export function colorStock(variants: Variant[], color: string): number {
  return variants.filter((v) => v.color === color).reduce((s, v) => s + v.stock, 0);
}

/** First colour that has stock, falling back to the first colour. */
export function defaultColor(variants: Variant[]): string | undefined {
  const colors = variantColors(variants);
  return colors.find((c) => colorStock(variants, c) > 0) ?? colors[0];
}

/* ---------- images ---------- */

/** Photos for a colour; colours without photos fall back to the default gallery. */
export function galleryForColor(product: Pick<ProductLike, "imageUrl" | "images" | "colorImages">, color?: string): string[] {
  const own = color ? product.colorImages[color] : undefined;
  if (own?.length) return own;
  return product.images.length ? product.images : [product.imageUrl];
}

/** Variant photo used in carts, orders and admin: the colour's first photo. */
export function variantImage(product: Pick<ProductLike, "imageUrl" | "images" | "colorImages">, color?: string): string {
  return galleryForColor(product, color)[0] ?? product.imageUrl;
}

/* ---------- display ---------- */

export function sizeRange(variants: Variant[], category: string): string | null {
  const sizes = variantSizes(variants, category);
  if (sizes.length === 0) return null;
  if (sizes.length === 1) return sizes[0];
  const cfg = CATEGORIES[category];
  const first = sizes[0];
  const last = sizes[sizes.length - 1];
  if (cfg?.key === "Handbags") return `${first}–${last}`;
  if (cfg?.key === "Shoes") return `EU ${first}–${last}`;
  return `${first}–${last}`;
}

/** Card subtitle, e.g. `Human Hair • Body Wave • 18"–26"`. */
export function cardHighlights(product: Pick<ProductLike, "category" | "attributes" | "variants">): string {
  const cfg = CATEGORIES[product.category];
  if (!cfg) return "";
  const parts = cfg.highlightKeys.map((k) => product.attributes[k]).filter(Boolean);
  const range = sizeRange(product.variants, product.category);
  if (range) parts.push(range);
  return parts.join(" • ");
}

/** Highlight chips on the product page, e.g. Human Hair, Body Wave, Curly / Not curly. */
export function highlightChips(product: Pick<ProductLike, "category" | "attributes">): string[] {
  const cfg = CATEGORIES[product.category];
  if (!cfg) return [];
  const chips = cfg.highlightKeys.map((k) => product.attributes[k]).filter(Boolean);
  if (product.attributes.curly) chips.push(product.attributes.curly === "Yes" ? "Curly" : "Not curly");
  return chips;
}

/** Specs table rows for the product page. */
export function specRows(product: ProductLike): { label: string; value: string }[] {
  const cfg = CATEGORIES[product.category];
  const rows: { label: string; value: string }[] = [];
  if (product.brand) rows.push({ label: "Brand", value: product.brand });
  rows.push({ label: "Type", value: product.subcategory });
  for (const attr of cfg?.attributes ?? []) {
    const value = product.attributes[attr.key];
    if (value) rows.push({ label: attr.label, value });
  }
  const colors = variantColors(product.variants);
  if (colors.length) rows.push({ label: "Colours", value: colors.join(", ") });
  const sizes = variantSizes(product.variants, product.category);
  if (sizes.length) rows.push({ label: cfg?.sizeLabel ?? "Sizes", value: sizes.join(", ") });
  return rows;
}

/** Filter groups for a set of products: every `filterable` attribute present in them. */
export function filterableAttributes(category: string): AttributeDef[] {
  return CATEGORIES[category]?.attributes.filter((a) => a.filterable) ?? [];
}

/* ---------- attributes ---------- */

/** Curly is derived from texture, but the admin can override it. */
export function curlyFromTexture(texture?: string): "Yes" | "No" | undefined {
  if (!texture) return undefined;
  return CURLY_TEXTURES.includes(texture) ? "Yes" : "No";
}

/* ---------- search ---------- */

/** Lower-case, hyphens as spaces, so "semi-human" matches "Semi-Human Hair". */
export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Everything searchable about a product, normalised. */
export function productSearchText(product: ProductLike): string {
  const attrValues = Object.entries(product.attributes).map(([key, value]) => {
    // "Curly = Yes" should be found by "curly"; "No" must not match it.
    if (key === "curly") return value === "Yes" ? "curly" : "";
    return value;
  });
  return normalizeSearch(
    [
      product.name,
      product.description,
      product.shortDescription,
      product.category,
      CATEGORIES[product.category]?.label,
      product.subcategory,
      product.brand,
      ...product.tags,
      ...attrValues,
      ...product.variants.flatMap((v) => [v.color, v.size]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/** Every word of the query must appear somewhere in the (already normalised) text. */
export function textMatchesQuery(searchText: string, query: string): boolean {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  return terms.every((t) => searchText.includes(t));
}

export function matchesQuery(product: ProductLike, query: string): boolean {
  return textMatchesQuery(productSearchText(product), query);
}
