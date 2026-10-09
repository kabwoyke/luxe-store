import { createOrder, listOrdersForUser } from "@/lib/orders";
import { createOrderSchema } from "@/lib/schemas/order";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requireApiUser } from "@/lib/session";

/** The signed-in user's orders, newest first. */
export async function GET() {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  return Response.json({ orders: await listOrdersForUser(user.id) });
}

/** Creates a pending order. Prices and stock are always re-read from the database. */
export async function POST(request: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const limit = rateLimit(`order-create:${user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests("Too many orders in a short time. Please try again in a few minutes.", limit.retryAfterSeconds);

  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await createOrder(user.id, parsed.data);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(
    {
      orderId: result.orderId,
      subtotal: result.subtotal,
      deliveryFee: result.deliveryFee,
      total: result.total,
    },
    { status: 201 }
  );
}
