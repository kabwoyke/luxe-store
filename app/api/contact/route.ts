import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/schemas/contact";

/** Public contact form. Stored for the admin to read; limited per visitor and guarded by a honeypot. */
export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request.headers)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests("You have sent several messages already. Please try again in a few minutes.", limit.retryAfterSeconds);

  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  }

  // A filled-in honeypot means a bot: say thanks, store nothing.
  if (parsed.data.website) return Response.json({ ok: true }, { status: 201 });

  const { name, email, phone, message } = parsed.data;
  await db.insert(contactMessages).values({ name, email: email.toLowerCase(), phone: phone || null, message });
  return Response.json({ ok: true }, { status: 201 });
}
