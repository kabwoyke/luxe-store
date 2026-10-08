import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getOrderFor } from "@/lib/orders";
import { orderStatusSchema } from "@/lib/schemas/order";
import { requireApiAdmin, requireApiUser } from "@/lib/session";

const idSchema = z.coerce.number().int().positive();

/** One order, only for its owner or an admin. Other people's orders look like missing ones. */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Order not found." }, { status: 404 });

  const order = await getOrderFor(id.data, user);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json({ order });
}

/** Admin only: move an order along (shipped, delivered, cancelled...). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const id = idSchema.safeParse((await ctx.params).id);
  const body = z.object({ status: orderStatusSchema }).safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const [result] = await db.update(orders).set({ status: body.data.status }).where(eq(orders.id, id.data));
  if (result.affectedRows === 0) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json({ ok: true });
}
