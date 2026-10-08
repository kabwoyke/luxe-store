import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { deliveryFeeFor } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { variantImage, variantLabel } from "@/lib/product-options";
import type { CreateOrderData } from "@/lib/schemas/order";

class OrderError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export type CreateOrderResult =
  | { ok: true; orderId: number; subtotal: number; deliveryFee: number; total: number }
  | { ok: false; status: number; error: string };

/**
 * Creates a pending order inside one transaction. Nothing from the client is trusted
 * except which product/variant and how many: prices, names, photos and stock all come
 * from the database. Stock is NOT deducted here; that happens when payment is confirmed
 * (Phase 6), and is re-checked under a row lock at that point.
 */
export async function createOrder(userId: number, input: CreateOrderData): Promise<CreateOrderResult> {
  // Merge duplicate lines so the stock check sees the true quantity per variant.
  const lines = new Map<string, { productId: number; variantId: string | null; quantity: number }>();
  for (const item of input.items) {
    const variantId = item.variantId ?? null;
    const key = `${item.productId}:${variantId ?? ""}`;
    const existing = lines.get(key);
    if (existing) existing.quantity += item.quantity;
    else lines.set(key, { productId: item.productId, variantId, quantity: item.quantity });
  }

  const rules = await getSettings();

  try {
    return await db.transaction(async (tx) => {
      const productIds = [...new Set([...lines.values()].map((l) => l.productId))];
      const rows = await tx.select().from(products).where(inArray(products.id, productIds));
      const byId = new Map(rows.map((p) => [p.id, p]));

      const items: (typeof orderItems.$inferInsert)[] = [];
      let subtotal = 0;

      for (const line of lines.values()) {
        const product = byId.get(line.productId);
        if (!product) throw new OrderError("One of the products in your cart is no longer available.", 400);

        let available = product.stock;
        let label: string | null = null;
        let color: string | undefined;

        if (product.variants.length > 0) {
          const variant = product.variants.find((v) => v.id === line.variantId);
          if (!variant) {
            throw new OrderError(`Please choose an option for ${product.name}.`, 400);
          }
          available = variant.stock;
          label = variantLabel(variant) || null;
          color = variant.color;
        } else if (line.variantId) {
          throw new OrderError(`${product.name} has no options to choose from.`, 400);
        }

        const name = label ? `${product.name} (${label})` : product.name;
        if (available <= 0) throw new OrderError(`${name} is sold out.`, 409);
        if (line.quantity > available) {
          throw new OrderError(`Only ${available} left of ${name}.`, 409);
        }

        subtotal += product.price * line.quantity;
        items.push({
          orderId: 0, // filled in below
          productId: product.id,
          variantId: line.variantId,
          quantity: line.quantity,
          price: product.price,
          productName: product.name,
          variantLabel: label,
          imageUrl: variantImage(product, color),
        });
      }

      const deliveryFee = deliveryFeeFor(subtotal, rules);
      const total = subtotal + deliveryFee;
      // Multi-store: the order belongs to the store of its first line.
      const storeId = byId.get(items[0].productId)!.storeId;

      const [created] = await tx.insert(orders).values({
        userId,
        storeId,
        status: "pending",
        total,
        deliveryFee,
        paymentMethod: "mpesa",
        paymentStatus: "pending",
        deliveryName: input.delivery.name,
        deliveryPhone: input.delivery.phone,
        deliveryCounty: input.delivery.county || null,
        deliveryAddress: input.delivery.address,
        deliveryNotes: input.delivery.notes || null,
      });
      const orderId = created.insertId;

      await tx.insert(orderItems).values(items.map((i) => ({ ...i, orderId })));
      return { ok: true as const, orderId, subtotal, deliveryFee, total };
    });
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, status: err.status, error: err.message };
    throw err;
  }
}

export type OrderWithItems = typeof orders.$inferSelect & { items: (typeof orderItems.$inferSelect)[] };

export async function attachItems(rows: (typeof orders.$inferSelect)[]): Promise<OrderWithItems[]> {
  if (rows.length === 0) return [];
  const items = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((o) => o.id)
      )
    );
  return rows.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
}

export async function listOrdersForUser(userId: number): Promise<OrderWithItems[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt), desc(orders.id));
  return attachItems(rows);
}

/** An order is only returned to its owner, or to an admin. */
export async function getOrderFor(
  orderId: number,
  user: { id: number; isAdmin: boolean }
): Promise<OrderWithItems | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(user.isAdmin ? eq(orders.id, orderId) : and(eq(orders.id, orderId), eq(orders.userId, user.id)));
  if (!row) return null;
  return (await attachItems([row]))[0];
}
