import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { reviewSchema } from "@/lib/schemas/review";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(`review:${clientIp(request.headers)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests("Too many reviews in a short time. Please try again later.", limit.retryAfterSeconds);

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review." },
      { status: 400 }
    );
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, parsed.data.productId));
  if (!product) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  await db.insert(reviews).values(parsed.data);
  revalidateTag("reviews", { expire: 0 });

  return Response.json({ ok: true }, { status: 201 });
}
