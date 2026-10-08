import { z } from "zod";

/** A stored photo: our own upload or seed file ("/uploads/..", "/products/.."), or a pasted http(s) URL. */
export const imageRefSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (v) => (/^\/[A-Za-z0-9._\-/]+$/.test(v) && !v.includes("..") && !v.startsWith("//")) || /^https?:\/\/\S+$/i.test(v),
    "That does not look like a valid image address."
  );

export const variantInputSchema = z.object({
  color: z.string().trim().min(1).max(60).optional(),
  colorHex: z.string().trim().optional(),
  size: z.string().trim().min(1).max(40).optional(),
  stock: z.number().int().min(0).max(100_000),
  sku: z.string().trim().max(60).optional(),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(255),
  description: z.string().trim().min(1, "Please enter a description").max(5000),
  shortDescription: z.string().trim().max(500).nullish(),
  price: z.number().int("Price must be a whole number of KES").min(1, "Price must be at least KES 1").max(10_000_000),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  brand: z.string().trim().max(100).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  storeId: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  /** Default gallery, used by colours that have no photos of their own. */
  images: z.array(imageRefSchema).max(12).default([]),
  /** Photos by colour name. */
  colorImages: z.record(z.string(), z.array(imageRefSchema).max(12)).default({}),
  variants: z.array(variantInputSchema).max(300).default([]),
  /** Only used when the product has no variants. With variants, stock is computed on the server. */
  stock: z.number().int().min(0).max(1_000_000).default(0),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductData = z.output<typeof productInputSchema>;
