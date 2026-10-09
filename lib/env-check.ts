/**
 * Start-up checks for a production deployment. Returns problems (the app should not run) and
 * warnings (it runs, but something is probably wrong). Pure, so it can be tested with a fake env.
 */
export function checkEnvironment(env: NodeJS.ProcessEnv = process.env): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];

  if (!env.DATABASE_URL?.trim()) problems.push("DATABASE_URL is not set");
  if ((env.AUTH_SECRET?.trim().length ?? 0) < 32) problems.push("AUTH_SECRET must be set to a random string of at least 32 characters");
  const authUrl = env.AUTH_URL?.trim() ?? "";
  if (!authUrl.startsWith("https://")) warnings.push("AUTH_URL is not an https:// address; session cookies will not be marked secure");
  if (/localhost|127\.0\.0\.1/.test(authUrl)) warnings.push("AUTH_URL still points at localhost");

  if (env.MPESA_ENV === "production") {
    const callback = env.MPESA_CALLBACK_URL?.trim() ?? "";
    if (!env.MPESA_CALLBACK_SECRET || env.MPESA_CALLBACK_SECRET.trim().length < 24) {
      problems.push("MPESA_CALLBACK_SECRET must be at least 24 characters in production");
    } else if (!callback.includes(`token=${env.MPESA_CALLBACK_SECRET.trim()}`)) {
      problems.push("MPESA_CALLBACK_URL must contain ?token= followed by MPESA_CALLBACK_SECRET");
    }
    if (!callback.startsWith("https://")) problems.push("MPESA_CALLBACK_URL must be an https:// address");
    if (/localhost|127\.0\.0\.1|ngrok|trycloudflare|loca\.lt/.test(callback)) {
      warnings.push("MPESA_CALLBACK_URL is a temporary tunnel or localhost address; use your real domain before launch");
    }
    if (env.MPESA_TRANSACTION_TYPE === "CustomerBuyGoodsOnline" && !env.MPESA_PARTY_B?.trim()) {
      warnings.push("Till payments: set MPESA_PARTY_B to your Till number (MPESA_SHORTCODE is the store/head-office number)");
    }
    if (env.MPESA_TRANSACTION_TYPE !== "CustomerBuyGoodsOnline" && env.MPESA_PARTY_B?.trim()) {
      warnings.push("MPESA_PARTY_B is set but MPESA_TRANSACTION_TYPE is not CustomerBuyGoodsOnline");
    }
    if (!env.MPESA_CALLBACK_ALLOWED_IPS?.trim()) {
      warnings.push("MPESA_CALLBACK_ALLOWED_IPS is empty; callbacks are protected by the token only");
    }
    if (!env.ADMIN_EMAIL?.trim()) warnings.push("ADMIN_EMAIL is not set");
  }
  return { problems, warnings };
}
