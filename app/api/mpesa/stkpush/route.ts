import { z } from "zod";
import { startPayment } from "@/lib/payments";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { requireApiUser } from "@/lib/session";

const bodySchema = z.object({
  orderId: z.number().int().positive(),
  phone: z.string().min(1),
});

/**
 * Sends an M-Pesa payment prompt for one of the signed-in user's pending orders.
 * The amount is never accepted from the client; it is read from the order.
 */
export async function POST(request: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const limit = rateLimit(`stkpush:${user.id}`, 5, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many payment attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return Response.json({ error: "Enter a valid Kenyan number, e.g. 0712 345 678." }, { status: 400 });
  }

  const result = await startPayment(user.id, { orderId: parsed.data.orderId, phone });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(
    {
      paymentId: result.paymentId,
      checkoutRequestId: result.checkoutRequestId,
      message: result.message,
    },
    { status: 201 }
  );
}
