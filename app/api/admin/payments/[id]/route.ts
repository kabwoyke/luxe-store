import { z } from "zod";
import { adminMarkPaid, adminRequeryPayment } from "@/lib/payments";
import { requireApiAdmin } from "@/lib/session";

const idSchema = z.coerce.number().int().positive();
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("requery") }),
  z.object({
    action: z.literal("mark-paid"),
    receipt: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,20}$/, "Enter the M-Pesa receipt code, e.g. NLJ7RT61SV."),
  }),
]);

/** Admin: re-check a pending payment with Daraja, or record one whose callback was lost. */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/payments/[id]">) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const id = idSchema.safeParse((await ctx.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!id.success) return Response.json({ error: "Payment not found." }, { status: 404 });
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });

  const result =
    body.data.action === "requery" ? await adminRequeryPayment(id.data) : await adminMarkPaid(id.data, body.data.receipt);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ message: result.message });
}
