import { timingSafeEqual } from "node:crypto";
import { applyPaymentResult } from "@/lib/payments";
import { readCallbackDetails, stkCallbackSchema } from "@/lib/mpesa/callback-schema";

const ACCEPTED = { ResultCode: 0, ResultDesc: "Accepted" };

function tokenMatches(given: string | null, expected: string): boolean {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Public endpoint Safaricom posts the STK Push result to. It has no session, so it is protected by:
 * an unguessable token in the callback URL (MPESA_CALLBACK_SECRET, e.g. ...?token=xxxx),
 * strict zod validation, and ignoring any CheckoutRequestID we did not issue.
 * Safaricom does not retry, so after the token check every request gets the "Accepted" reply.
 */
export async function POST(request: Request) {
  const secret = process.env.MPESA_CALLBACK_SECRET?.trim();
  const live = process.env.MPESA_ENV === "production" && !process.env.MPESA_BASE_URL;
  if (!secret && live) {
    // Never accept unauthenticated callbacks when real money is involved.
    console.error("[mpesa] callback rejected: MPESA_CALLBACK_SECRET is not set");
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (secret && !tokenMatches(new URL(request.url).searchParams.get("token"), secret)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await request.text();
  // Raw body is logged for debugging. It holds a phone number and receipt, but no secrets.
  console.log("[mpesa] callback:", raw.slice(0, 2000));

  try {
    const parsed = stkCallbackSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn("[mpesa] callback ignored: unexpected shape");
      return Response.json(ACCEPTED);
    }

    const cb = parsed.data.Body.stkCallback;
    const details = readCallbackDetails(cb);
    const outcome = await applyPaymentResult({
      checkoutRequestId: cb.CheckoutRequestID,
      resultCode: cb.ResultCode,
      resultDesc: cb.ResultDesc,
      receipt: details.receipt,
      paidAt: details.paidAt,
      amount: details.amount,
    });
    console.log("[mpesa] callback outcome:", cb.CheckoutRequestID, outcome);
  } catch (err) {
    // The STK query fallback will reconcile this payment, so still acknowledge.
    console.error("[mpesa] callback processing failed:", err);
  }

  return Response.json(ACCEPTED);
}
