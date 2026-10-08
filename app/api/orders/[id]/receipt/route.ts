import { z } from "zod";
import { getOrderFor } from "@/lib/orders";
import { buildReceipt } from "@/lib/receipt";
import { requireApiUser } from "@/lib/session";

/**
 * PDF receipt for a paid order, for its owner (or an admin).
 * The page links use the HTML `download` attribute to name the file and force the download;
 * opening the URL directly shows the PDF in the browser.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]/receipt">) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const id = z.coerce.number().int().positive().safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Order not found." }, { status: 404 });

  const order = await getOrderFor(id.data, user);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

  const receipt = await buildReceipt(order);
  if (!receipt) return Response.json({ error: "This order has not been paid yet." }, { status: 409 });

  return new Response(Buffer.from(receipt.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
