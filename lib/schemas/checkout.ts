import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { deliverySchema } from "@/lib/schemas/order";

/** Checkout form: the delivery details, plus an optional different number to pay with. */
export const checkoutFormSchema = deliverySchema.extend({
  /** Leave empty to pay with the delivery phone. */
  mpesaPhone: z
    .string()
    .trim()
    .refine((p) => p === "" || normalizePhone(p) !== null, "Enter a valid Safaricom number, e.g. 0712 345 678")
    .transform((p) => (p === "" ? undefined : (normalizePhone(p) as string))),
});

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormData = z.output<typeof checkoutFormSchema>;
