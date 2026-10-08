import { cacheLife, cacheTag } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, products, reviews, type Product } from "@/db/schema";

/**
 * Catalogue reads are cached and tagged "products" / "collections".
 * Admin writes call revalidateTag on these tags (Phase 7).
 * At this catalogue size, listing pages fetch everything and filter in code.
 */

export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");
  return db.select().from(products).orderBy(desc(products.createdAt), desc(products.id));
}

export async function getCollections() {
  "use cache";
  cacheTag("collections");
  cacheLife("minutes");
  return db.select().from(collections);
}

export async function getCollectionBySlug(slug: string) {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getProductsForCollection(productIds: number[]): Promise<Product[]> {
  const all = await getAllProducts();
  const byId = new Map(all.map((p) => [p.id, p]));
  return productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
}

export async function getProductById(id: number): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.id === id) ?? null;
}

export async function getReviews(productId: number) {
  "use cache";
  cacheTag("reviews");
  cacheLife("minutes");
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt), desc(reviews.id));
}
