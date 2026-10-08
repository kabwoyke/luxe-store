import { createHash } from "node:crypto";
import type { ImageExt } from "@/lib/storage";

/**
 * Cloudinary storage for product photos, over its REST upload API (no SDK needed).
 * Uploads are signed on the server with the API secret, which never reaches the browser.
 * https://cloudinary.com/documentation/image_upload_api_reference
 */

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  apiBase: string;
};

/**
 * Reads CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD_NAME, as shown on the Cloudinary dashboard)
 * or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
 * Returns null when Cloudinary is not configured, so the app falls back to local storage.
 */
export function getCloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  let cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
  let apiKey = env.CLOUDINARY_API_KEY?.trim();
  let apiSecret = env.CLOUDINARY_API_SECRET?.trim();

  const url = env.CLOUDINARY_URL?.trim();
  if (url && (!cloudName || !apiKey || !apiSecret)) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "cloudinary:") {
        cloudName ||= parsed.hostname;
        apiKey ||= decodeURIComponent(parsed.username);
        apiSecret ||= decodeURIComponent(parsed.password);
      }
    } catch {
      // Ignore a malformed CLOUDINARY_URL; the individual variables may still be set.
    }
  }
  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: env.CLOUDINARY_FOLDER?.trim() || "luxestore",
    // CLOUDINARY_API_BASE exists so tests can point at a mock; leave it unset in real deployments.
    apiBase: env.CLOUDINARY_API_BASE?.trim() || "https://api.cloudinary.com",
  };
}

/**
 * Signature for a signed upload: the parameters (except file, api_key and resource_type) sorted by name,
 * joined as name=value pairs with "&", with the API secret appended, then SHA-1 hashed.
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

const MIME: Record<ImageExt, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Uploads the photo and returns its permanent https URL. */
export async function uploadToCloudinary(bytes: Buffer, ext: ImageExt, config: CloudinaryConfig): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { folder: config.folder, timestamp };

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: MIME[ext] }), `photo.${ext}`);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", config.folder);
  form.append("signature", signParams(signed, config.apiSecret));

  const res = await fetch(`${config.apiBase}/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !body.secure_url) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${body.error?.message ?? "no URL returned"}`);
  }
  return body.secure_url;
}

/**
 * Asks Cloudinary for a version of the photo at the width the page needs, in the best format the
 * browser supports (f_auto) and automatic quality. Anything that is not a plain Cloudinary upload URL
 * is returned unchanged.
 */
export function cloudinaryDeliveryUrl(src: string, width: number): string {
  const match = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/.exec(src);
  if (!match) return src;
  const [, prefix, rest] = match;
  // A first path segment like "w_300,c_fill" means a transformation is already there.
  if (/^[a-z]{1,3}_[^/]+\//.test(rest) && !/^v\d+\//.test(rest)) return src;
  return `${prefix}f_auto,q_auto,w_${width}/${rest}`;
}
