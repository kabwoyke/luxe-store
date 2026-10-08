import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireApiAdmin } from "@/lib/session";

/** Admin: contact form messages, newest first. */
export async function GET() {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt), desc(contactMessages.id)).limit(500);
  return Response.json({ messages });
}
