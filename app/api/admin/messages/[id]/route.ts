import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireApiAdmin } from "@/lib/session";

/** Admin: mark a message handled (or not). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/messages/[id]">) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const id = z.coerce.number().int().positive().safeParse((await ctx.params).id);
  const body = z.object({ handled: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const [result] = await db.update(contactMessages).set({ handled: body.data.handled }).where(eq(contactMessages.id, id.data));
  if (result.affectedRows === 0) return Response.json({ error: "Message not found." }, { status: 404 });
  return Response.json({ ok: true });
}
