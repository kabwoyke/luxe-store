import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { collections, orderItems, products } from "@/db/schema";
import { getProductById } from "@/lib/catalog";
import { resolveStoreId, revalidateCatalog } from "@/lib/catalog-admin";
import { buildProductValues } from "@/lib/product-write";
import { productInputSchema } from "@/lib/schemas/product";
import { requireApiAdmin } from "@/lib/session";

const idSchema = z.coerce.number().int().positive();

export async function GET(_request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const id = idSchema.safeParse((await ctx.params).id);
  const product = id.success ? await getProductById(id.data) : null;
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
  return Response.json({ product });
}

/** Admin: replace a product's details. */
export async function PUT(request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Product not found." }, { status: 404 });

  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid product." }, { status: 400 });
  }
  const built = buildProductValues(parsed.data);
  if (!built.ok) return Response.json({ error: built.error }, { status: 400 });

  const [existing] = await db.select({ storeId: products.storeId }).from(products).where(eq(products.id, id.data));
  if (!existing) return Response.json({ error: "Product not found." }, { status: 404 });

  const storeId = parsed.data.storeId ? await resolveStoreId(parsed.data.category, parsed.data.storeId) : existing.storeId;
  if (!storeId) return Response.json({ error: "That store does not exist." }, { status: 400 });

  await db.update(products).set({ ...built.values, storeId }).where(eq(products.id, id.data));
  revalidateCatalog();
  return Response.json({ ok: true });
}

/** Admin: delete a product that has never been ordered. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Product not found." }, { status: 404 });

  const result = await db.transaction(async (tx) => {
    const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.id, id.data)).for("update");
    if (!product) return "missing" as const;

    const [ordered] = await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, id.data)).limit(1);
    if (ordered) return "ordered" as const;

    // Take it out of any collection, then delete (reviews and stock logs go with it).
    for (const c of await tx.select().from(collections)) {
      if (c.productIds.includes(id.data)) {
        await tx.update(collections).set({ productIds: c.productIds.filter((p) => p !== id.data) }).where(eq(collections.id, c.id));
      }
    }
    await tx.delete(products).where(eq(products.id, id.data));
    return "deleted" as const;
  });

  if (result === "missing") return Response.json({ error: "Product not found." }, { status: 404 });
  if (result === "ordered") {
    return Response.json(
      { error: "This product is part of past orders, so it cannot be deleted. Set its stock to 0 instead." },
      { status: 409 }
    );
  }
  revalidateCatalog();
  return Response.json({ ok: true });
}
