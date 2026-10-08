import { z } from "zod";
import { exportCsv } from "@/lib/admin-data";
import { requireApiAdmin } from "@/lib/session";

const typeSchema = z.enum(["orders", "products", "customers"]);

/** Admin: CSV download of orders, products or customers (?type=orders). */
export async function GET(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const type = typeSchema.safeParse(new URL(request.url).searchParams.get("type"));
  if (!type.success) return Response.json({ error: "type must be orders, products or customers." }, { status: 400 });

  const csv = await exportCsv(type.data);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
