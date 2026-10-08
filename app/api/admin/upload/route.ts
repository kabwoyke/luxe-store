import { detectImageType, MAX_UPLOAD_BYTES, storage } from "@/lib/storage";
import { requireApiAdmin } from "@/lib/session";

/** Admin only. Accepts one JPEG, PNG or WebP (the browser resizes it first) and returns its URL. */
export async function POST(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file was sent." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "That photo is too large (5 MB maximum)." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = detectImageType(bytes);
  if (!ext) return Response.json({ error: "Please upload a JPEG, PNG or WebP photo." }, { status: 415 });

  try {
    return Response.json({ url: await storage.save(bytes, ext) }, { status: 201 });
  } catch (err) {
    // The provider's message can name accounts or keys, so it stays in the server log.
    console.error("[storage] upload failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Photo storage is not available right now. Please try again." }, { status: 502 });
  }
}
