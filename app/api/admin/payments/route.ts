import { listAdminPayments } from "@/lib/admin-data";
import { requireApiAdmin } from "@/lib/session";

const STATUSES = ["pending", "paid", "failed", "cancelled"];

/** Admin: payments with their order and customer. Optional ?q=search and ?status=paid. */
export async function GET(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  if (status && !STATUSES.includes(status)) return Response.json({ error: "Unknown status." }, { status: 400 });

  return Response.json({ payments: await listAdminPayments({ q: params.get("q")?.slice(0, 100), status: status ?? undefined }) });
}
