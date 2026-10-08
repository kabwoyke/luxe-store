import { z } from "zod";
import { getOrderFor } from "@/lib/orders";
import { getPaymentStatus } from "@/lib/payments";
import { requireApiUser } from "@/lib/session";

/**
 * Payment status for the order page to poll (about every 3 seconds).
 * If a prompt has been pending for a while it also asks Daraja (STK Query), in case the callback was missed.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]/payment">) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const id = z.coerce.number().int().positive().safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Order not found." }, { status: 404 });

  // Ownership check first: other people's orders look like missing ones.
  const order = await getOrderFor(id.data, user);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

  const status = await getPaymentStatus(order.id);
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}
