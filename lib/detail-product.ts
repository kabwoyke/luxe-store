import type { Product } from "@/db/schema";

/** The product fields the product page needs on the client. */
export type DetailProduct = Pick<
  Product,
  | "id"
  | "name"
  | "description"
  | "shortDescription"
  | "price"
  | "category"
  | "subcategory"
  | "brand"
  | "tags"
  | "stock"
  | "imageUrl"
  | "images"
  | "attributes"
  | "colorImages"
  | "variants"
>;

export function toDetailProduct(p: Product): DetailProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    shortDescription: p.shortDescription,
    price: p.price,
    category: p.category,
    subcategory: p.subcategory,
    brand: p.brand,
    tags: p.tags,
    stock: p.stock,
    imageUrl: p.imageUrl,
    images: p.images,
    attributes: p.attributes,
    colorImages: p.colorImages,
    variants: p.variants,
  };
}
