import { CONTENT_TYPES, readUpload, UPLOAD_NAME, type ImageExt } from "@/lib/storage";

/** Serves photos saved by the local storage driver. Names are random, so files never change: cache hard. */
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path } = await ctx.params;
  const name = path.length === 1 ? path[0] : "";
  if (!UPLOAD_NAME.test(name)) return new Response("Not found", { status: 404 });

  const bytes = await readUpload(name);
  if (!bytes) return new Response("Not found", { status: 404 });

  const ext = name.split(".")[1] as ImageExt;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
