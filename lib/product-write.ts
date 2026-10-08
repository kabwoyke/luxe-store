import type { NewProduct } from "@/db/schema";
import type { ProductData } from "@/lib/schemas/product";
import {
  CATEGORIES,
  curlyFromTexture,
  findPresetColor,
  sumVariantStock,
  upsertVariants,
  type Variant,
} from "@/lib/product-options";

export const NO_IMAGE = "/no-image.svg";

const HEX = /^#[0-9a-f]{6}$/i;

export type ProductWrite =
  | { ok: true; values: Omit<NewProduct, "storeId" | "id" | "createdAt"> }
  | { ok: false; error: string };

/**
 * Turns validated admin input into the row to store. Everything the client could get wrong is
 * decided here: stock is the sum of the variants, a (colour, size) pair exists once, options must
 * come from the category config, and photos of colours that no longer exist are dropped.
 */
export function buildProductValues(data: ProductData): ProductWrite {
  const cfg = CATEGORIES[data.category];
  if (!cfg) return { ok: false, error: `Unknown category "${data.category}".` };
  if (!cfg.types.includes(data.subcategory)) {
    return { ok: false, error: `"${data.subcategory}" is not a type of ${cfg.label}.` };
  }

  // Attributes: only the category's own dropdowns, and only listed options.
  const attributes: Record<string, string> = {};
  for (const attr of cfg.attributes) {
    const value = data.attributes[attr.key]?.trim();
    if (!value) continue;
    if (!attr.options.includes(value)) return { ok: false, error: `"${value}" is not a valid ${attr.label.toLowerCase()}.` };
    attributes[attr.key] = value;
  }
  // Curly follows the texture unless the admin set it themselves.
  if (cfg.key === "Wigs" && attributes.texture && !attributes.curly) {
    attributes.curly = curlyFromTexture(attributes.texture) ?? "No";
  }

  // Variants.
  const withColor = data.variants.filter((v) => v.color).length;
  const withSize = data.variants.filter((v) => v.size).length;
  if (data.variants.some((v) => !v.color && !v.size)) {
    return { ok: false, error: "Each option needs a colour, a size, or both." };
  }
  if ((withColor !== 0 && withColor !== data.variants.length) || (withSize !== 0 && withSize !== data.variants.length)) {
    return { ok: false, error: "Use the same kind of options on every variant (all with colours, all with sizes, or both)." };
  }

  const incoming: Omit<Variant, "id">[] = [];
  for (const v of data.variants) {
    if (v.size && cfg.sizes && !cfg.sizes.includes(v.size)) {
      return { ok: false, error: `"${v.size}" is not a valid ${cfg.sizeLabel.toLowerCase()}.` };
    }
    let colorHex: string | undefined;
    if (v.color) {
      const preset = findPresetColor(data.category, v.color);
      colorHex = preset?.hex ?? v.colorHex;
      if (!colorHex || !HEX.test(colorHex)) {
        return { ok: false, error: `Pick a colour for "${v.color}" (custom colours need a colour swatch).` };
      }
    }
    incoming.push({ color: v.color, colorHex, size: v.size, stock: v.stock, sku: v.sku || undefined });
  }
  const variants = upsertVariants([], incoming);
  const colors = new Set(variants.map((v) => v.color).filter(Boolean));

  // Photos: keep only colours that still have variants.
  const colorImages: Record<string, string[]> = {};
  for (const [color, urls] of Object.entries(data.colorImages)) {
    if (colors.has(color) && urls.length > 0) colorImages[color] = urls;
  }

  const firstColor = variants.find((v) => v.color)?.color;
  const images = data.images;
  const imageUrl =
    images[0] ?? (firstColor ? colorImages[firstColor]?.[0] : undefined) ?? Object.values(colorImages)[0]?.[0] ?? NO_IMAGE;

  return {
    ok: true,
    values: {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription || null,
      price: data.price,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand || null,
      tags: [...new Set(data.tags)],
      attributes,
      featured: data.featured,
      bestSeller: data.bestSeller,
      newArrival: data.newArrival,
      images,
      colorImages,
      variants,
      imageUrl,
      // Never trusted from the client when variants exist.
      stock: variants.length > 0 ? sumVariantStock(variants) : data.stock,
    },
  };
}
