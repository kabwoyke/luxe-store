/** Customer-friendly text for an STK Push result code. Safe to use on the client. */
export function describePaymentFailure(resultCode: number | null, fallback?: string | null): string {
  switch (resultCode) {
    case 1032:
      return "You cancelled the M-Pesa request on your phone.";
    case 1:
      return "Your M-Pesa balance was too low for this payment.";
    case 2001:
      return "The M-Pesa PIN entered was wrong.";
    case 1037:
      return "The M-Pesa request timed out because it was not answered in time.";
    case 1025:
    case 1019:
      return "M-Pesa could not process the request. Please try again.";
    case 17:
      return "M-Pesa limited this payment. Please try again in a few minutes.";
    default:
      return fallback?.trim() || "The M-Pesa payment did not go through.";
  }
}
