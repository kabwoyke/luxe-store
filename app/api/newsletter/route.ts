import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.email().max(191) });

export async function POST(request: Request) {
  const limit = rateLimit(`newsletter:${clientIp(request.headers)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests("Too many sign-ups. Please try again later.", limit.retryAfterSeconds);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  // Subscribing twice is not an error.
  await db
    .insert(newsletterSubscribers)
    .values({ email })
    .onDuplicateKeyUpdate({ set: { email } });

  return Response.json({ ok: true });
}
