import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";

/** Admin writes call this so the storefront shows the change immediately. */
export function revalidateCatalog() {
  revalidateTag("products", { expire: 0 });
  revalidateTag("collections", { expire: 0 });
}

/** Wigs belong to the wig store, everything else to the main store (falling back to the first store). */
export async function resolveStoreId(category: string, requested?: number): Promise<number | null> {
  if (requested) {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, requested));
    return store?.id ?? null;
  }
  const slug = category === "Wigs" ? "luxe-wigs" : "luxe-main";
  const [preferred] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, slug));
  if (preferred) return preferred.id;
  const [first] = await db.select({ id: stores.id }).from(stores).limit(1);
  return first?.id ?? null;
}
