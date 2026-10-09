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
  paidAt?: Date;
};

/** Daraja sends TransactionDate as a number like 20191219102115 (YYYYMMDDHHmmss, East Africa Time, UTC+3). */
export function parseTransactionDate(value: string | number | undefined): Date | undefined {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(value ?? ""));
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h - 3, mi, s));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Pulls Amount, MpesaReceiptNumber and PhoneNumber out of CallbackMetadata. */
export function readCallbackDetails(cb: StkCallback): CallbackDetails {
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  const amount = get("Amount");
  const receipt = get("MpesaReceiptNumber");
  const phone = get("PhoneNumber");
  const paidAt = parseTransactionDate(get("TransactionDate"));
  return {
    paidAt,
    amount: amount === undefined ? undefined : Number(amount),
    receipt: receipt === undefined ? undefined : String(receipt),
    phone: phone === undefined ? undefined : String(phone),
  };
}
