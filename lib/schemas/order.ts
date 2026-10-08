import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "cancelled"] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

/**
 * Deliberately has no price or total: the server always reads those from the database,
 * and zod drops any extra keys a client sends.
 */
export const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.string().max(100).nullish(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99),
});

export const deliverySchema = z.object({
  name: z.string().trim().min(1, "Please enter the recipient's name").max(150),
  phone: z
    .string()
    .refine((p) => normalizePhone(p) !== null, "Enter a valid Kenyan number, e.g. 0712 345 678")
    .transform((p) => normalizePhone(p) as string),
  county: z.string().trim().max(100).optional(),
  address: z.string().trim().min(1, "Please enter a delivery address").max(500),
  notes: z.string().trim().max(500).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "Your cart is empty").max(50),
  delivery: deliverySchema,
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderData = z.output<typeof createOrderSchema>;
