import { listCustomers } from "@/lib/admin-data";
import { requireApiAdmin } from "@/lib/session";

export async function GET() {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;
  return Response.json({ customers: await listCustomers() });
}
