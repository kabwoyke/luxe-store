import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { settingsSchema } from "@/lib/schemas/settings";
import { requireApiAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { storageDriver } from "@/lib/storage";

export async function GET() {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;
  return Response.json({ settings: await getSettings(), storage: storageDriver });
}

/** Admin: save delivery and stock rules. Takes effect on the storefront straight away. */
export async function PUT(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  }
  revalidateTag("settings", { expire: 0 });
  return Response.json({ settings: parsed.data });
}
