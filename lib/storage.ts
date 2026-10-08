import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";

/**
 * Where uploaded product photos live. Photos are never stored in the database, only their URLs.
 *
 * Cloudinary is used whenever its credentials are set (see lib/cloudinary.ts); otherwise photos are
 * saved on the local disk, which suits development and a server with a persistent disk.
 * The rest of the app only talks to `ImageStorage`, so another provider is one more class below.
 */
export type ImageExt = "jpg" | "png" | "webp";

export interface ImageStorage {
  /** Saves the bytes and returns the public URL to store on the product. */
  save(bytes: Buffer, ext: ImageExt): Promise<string>;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR?.trim() || "uploads");

/** Names we generate: 32 hex characters plus an extension. Anything else is rejected when serving. */
export const UPLOAD_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export const CONTENT_TYPES: Record<ImageExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Identifies the real image type from the file's first bytes, ignoring whatever the client claimed. */
export function detectImageType(bytes: Buffer): ImageExt | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length > 12 && bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

class LocalDiskStorage implements ImageStorage {
  async save(bytes: Buffer, ext: ImageExt): Promise<string> {
    await mkdir(/* turbopackIgnore: true */ UPLOAD_DIR, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), bytes);
    return `/uploads/${name}`;
  }
}

class CloudinaryStorage implements ImageStorage {
  constructor(private readonly config: NonNullable<ReturnType<typeof getCloudinaryConfig>>) {}

  save(bytes: Buffer, ext: ImageExt): Promise<string> {
    return uploadToCloudinary(bytes, ext, this.config);
  }
}

const cloudinary = getCloudinaryConfig();

/** Which driver is active, for the admin screen and logs. */
export const storageDriver: "cloudinary" | "local" = cloudinary ? "cloudinary" : "local";

export const storage: ImageStorage = cloudinary ? new CloudinaryStorage(cloudinary) : new LocalDiskStorage();

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    return await readFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name));
  } catch {
    return null;
  }
}
