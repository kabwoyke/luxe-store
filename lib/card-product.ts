import type { Product } from "@/db/schema";
import { productSearchText, type ProductLike } from "@/lib/product-options";

/** The slim product shape sent to client components for cards, filters and search. */
export type CardProduct = Pick<
  ProductLike,
  "name" | "category" | "subcategory" | "imageUrl" | "attributes" | "colorImages" | "variants"
> & {
  id: number;
  price: number;
  stock: number;
  brand: string | null;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  createdAt: string;
  /** Normalised text covering everything searchable, so client-side search matches the server's. */
  searchText: string;
};

export function toCardProduct(p: Product): CardProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    imageUrl: p.imageUrl,
    attributes: p.attributes,
    // Cards only swap between each colour's first photo.
    colorImages: Object.fromEntries(
      Object.entries(p.colorImages).map(([color, urls]) => [color, urls.slice(0, 1)])
    ),
    variants: p.variants,
    price: p.price,
    stock: p.stock,
    brand: p.brand,
    featured: p.featured,
    bestSeller: p.bestSeller,
    newArrival: p.newArrival,
    createdAt: p.createdAt.toISOString(),
    searchText: productSearchText(p),
  };
}
