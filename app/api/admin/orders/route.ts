import { listAdminOrders } from "@/lib/admin-data";
import { orderStatusSchema } from "@/lib/schemas/order";
import { requireApiAdmin } from "@/lib/session";

/** Admin: every order with its items and customer. Optional ?status=paid. */
export async function GET(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const status = new URL(request.url).searchParams.get("status");
  const parsed = status ? orderStatusSchema.safeParse(status) : null;
  if (parsed && !parsed.success) return Response.json({ error: "Unknown status." }, { status: 400 });

  return Response.json({ orders: await listAdminOrders(parsed?.data) });
}
