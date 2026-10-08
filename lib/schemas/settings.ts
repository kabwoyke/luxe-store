import { z } from "zod";

/** Whole KES / whole units, plus the contact details shown on the contact page and in the footer. */
export const settingsSchema = z.object({
  deliveryFee: z.number().int().min(0).max(100_000),
  freeDeliveryThreshold: z.number().int().min(0).max(10_000_000),
  lowStockThreshold: z.number().int().min(0).max(1000),
  supportEmail: z.union([z.literal(""), z.email("Enter a valid email address").max(191)]),
  supportPhone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  businessAddress: z.string().trim().max(300),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  deliveryFee: 300,
  freeDeliveryThreshold: 5000,
  lowStockThreshold: 5,
  supportEmail: "",
  supportPhone: "",
  whatsapp: "",
  businessAddress: "",
};
