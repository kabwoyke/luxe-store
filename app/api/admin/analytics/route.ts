import { getAnalytics } from "@/lib/admin-data";
import { requireApiAdmin } from "@/lib/session";

/** Admin: sales and inventory numbers for the dashboard overview. */
export async function GET() {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;
  return Response.json(await getAnalytics(), { headers: { "Cache-Control": "no-store" } });
}
