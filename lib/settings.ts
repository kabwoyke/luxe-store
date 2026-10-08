import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from "@/lib/schemas/settings";

/** Store settings with defaults filled in. Cached; saving settings clears the "settings" tag. */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag("settings");
  cacheLife("minutes");

  const rows = await db.select().from(settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const parsed = settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...stored });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}
