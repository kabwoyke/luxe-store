import { z } from "zod";

/** Shape of the STK Push callback Daraja posts to MPESA_CALLBACK_URL. */
export const stkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })),
        })
        .optional(),
    }),
  }),
});

export type StkCallback = z.infer<typeof stkCallbackSchema>["Body"]["stkCallback"];

export type CallbackDetails = {
  amount?: number;
  receipt?: string;
  phone?: string;
};

/** Pulls Amount, MpesaReceiptNumber and PhoneNumber out of CallbackMetadata. */
export function readCallbackDetails(cb: StkCallback): CallbackDetails {
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  const amount = get("Amount");
  const receipt = get("MpesaReceiptNumber");
  const phone = get("PhoneNumber");
  return {
    amount: amount === undefined ? undefined : Number(amount),
    receipt: receipt === undefined ? undefined : String(receipt),
    phone: phone === undefined ? undefined : String(phone),
  };
}
