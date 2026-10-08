import { z } from "zod";

/** Whole KES / whole units. */
export const settingsSchema = z.object({
  deliveryFee: z.number().int().min(0).max(100_000),
  freeDeliveryThreshold: z.number().int().min(0).max(10_000_000),
  lowStockThreshold: z.number().int().min(0).max(1000),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  deliveryFee: 300,
  freeDeliveryThreshold: 5000,
  lowStockThreshold: 5,
};
