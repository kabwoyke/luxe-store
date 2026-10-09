import { timingSafeEqual } from "node:crypto";
import { applyPaymentResult } from "@/lib/payments";
import { readCallbackDetails, stkCallbackSchema } from "@/lib/mpesa/callback-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const ACCEPTED = { ResultCode: 0, ResultDesc: "Accepted" };
/** A real STK callback is well under 2 KB. */
const MAX_BODY_BYTES = 10_000;

/**
 * Optional second lock: MPESA_CALLBACK_ALLOWED_IPS is a comma-separated list of Safaricom's callback
 * addresses (copy the current list from the Daraja portal). Empty means no IP check.
 */
function ipAllowed(request: Request): boolean {
  const allowed = (process.env.MPESA_CALLBACK_ALLOWED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.length === 0 || allowed.includes(clientIp(request.headers));
}

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

  if (!ipAllowed(request)) {
    console.warn("[mpesa] callback rejected: IP not on MPESA_CALLBACK_ALLOWED_IPS:", clientIp(request.headers));
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Generous (Safaricom sends one per payment) but stops a flood from reaching the database.
  if (!rateLimit(`mpesa-callback:${clientIp(request.headers)}`, 120, 60_000).ok) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    console.warn("[mpesa] callback ignored: body too large");
    return Response.json(ACCEPTED);
  }
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
      merchantRequestId: cb.MerchantRequestID,
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
