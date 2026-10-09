/**
 * Safaricom Daraja client (Lipa Na M-Pesa Online / STK Push). Server-side only:
 * never import this from a client component, and never log keys or tokens.
 */

const BASE_URLS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

const REQUEST_TIMEOUT_MS = 20_000;
/** Refresh the cached token this long before it expires. */
const TOKEN_EARLY_REFRESH_MS = 5 * 60 * 1000;

export class MpesaConfigError extends Error {}

export class MpesaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** Daraja's own error code, e.g. "500.001.1001" while a transaction is still processing. */
    readonly code?: string
  ) {
    super(message);
  }
}

export type MpesaConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  /** Who receives the money: the paybill, or the Till number for Buy Goods. */
  partyB: string;
  passkey: string;
  transactionType: string;
  callbackUrl: string;
};

/** Reads and checks the M-Pesa env vars. Throws MpesaConfigError naming whatever is missing. */
export function getMpesaConfig(env: NodeJS.ProcessEnv = process.env): MpesaConfig {
  const mode = env.MPESA_ENV === "production" ? "production" : "sandbox";
  const required = {
    MPESA_CONSUMER_KEY: env.MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET: env.MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE: env.MPESA_SHORTCODE,
    MPESA_PASSKEY: env.MPESA_PASSKEY,
    MPESA_CALLBACK_URL: env.MPESA_CALLBACK_URL,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new MpesaConfigError(`M-Pesa is not configured. Missing: ${missing.join(", ")}`);
  }

  // A callback URL that cannot receive the result would charge customers without ever marking the order paid.
  const baseOverride = env.MPESA_BASE_URL?.trim();
  try {
    const callback = new URL(required.MPESA_CALLBACK_URL!.trim());
    if (!callback.pathname.replace(/\/$/, "").endsWith("/api/mpesa/callback")) {
      throw new MpesaConfigError(
        "MPESA_CALLBACK_URL must end with /api/mpesa/callback (e.g. https://your-host/api/mpesa/callback?token=SECRET)"
      );
    }
    if (mode === "production" && !baseOverride && callback.protocol !== "https:") {
      throw new MpesaConfigError("MPESA_CALLBACK_URL must be HTTPS in production");
    }
  } catch (err) {
    if (err instanceof MpesaConfigError) throw err;
    throw new MpesaConfigError("MPESA_CALLBACK_URL is not a valid URL");
  }
  if (mode === "production" && !baseOverride && !env.MPESA_CALLBACK_SECRET?.trim()) {
    throw new MpesaConfigError("MPESA_CALLBACK_SECRET is required in production (and must match ?token= in MPESA_CALLBACK_URL)");
  }

  const transactionType = env.MPESA_TRANSACTION_TYPE?.trim() || "CustomerPayBillOnline";
  if (transactionType !== "CustomerPayBillOnline" && transactionType !== "CustomerBuyGoodsOnline") {
    throw new MpesaConfigError("MPESA_TRANSACTION_TYPE must be CustomerPayBillOnline (Paybill) or CustomerBuyGoodsOnline (Till)");
  }
  if (!/^\d{5,7}$/.test(required.MPESA_SHORTCODE!.trim()) || (env.MPESA_PARTY_B?.trim() && !/^\d{5,7}$/.test(env.MPESA_PARTY_B.trim()))) {
    throw new MpesaConfigError("MPESA_SHORTCODE and MPESA_PARTY_B must be numbers (5 to 7 digits)");
  }

  return {
    // MPESA_BASE_URL exists so tests can point at a mock Daraja; leave it unset in real deployments.
    baseUrl: env.MPESA_BASE_URL?.trim() || BASE_URLS[mode],
    consumerKey: required.MPESA_CONSUMER_KEY!.trim(),
    consumerSecret: required.MPESA_CONSUMER_SECRET!.trim(),
    shortcode: required.MPESA_SHORTCODE!.trim(),
    partyB: env.MPESA_PARTY_B?.trim() || required.MPESA_SHORTCODE!.trim(),
    passkey: required.MPESA_PASSKEY!.trim(),
    transactionType,
    callbackUrl: required.MPESA_CALLBACK_URL!.trim(),
  };
}

/* ---------- pure helpers ---------- */

/** Daraja timestamp, YYYYMMDDHHmmss, in East Africa Time. */
export function darajaTimestamp(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

/** Password = base64(Shortcode + Passkey + Timestamp). */
export function darajaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

/* ---------- access token (cached in memory) ---------- */

let cachedToken: { value: string; expiresAt: number; key: string } | null = null;
let inflightToken: Promise<string> | null = null;

/** Forgets the cached token (used after a 401, and by tests). */
export function clearTokenCache() {
  cachedToken = null;
  inflightToken = null;
}

async function requestJson(url: string, init: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });
  } catch {
    throw new MpesaApiError("Could not reach M-Pesa. Please try again.");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, body };
}

/** OAuth token. Reused until about 5 minutes before it expires; concurrent callers share one request. */
export async function getAccessToken(config = getMpesaConfig()): Promise<string> {
  const key = `${config.baseUrl}|${config.consumerKey}`;
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAt - TOKEN_EARLY_REFRESH_MS > Date.now()) {
    return cachedToken.value;
  }
  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    const basic = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
    const { status, body } = await requestJson(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: { Authorization: `Basic ${basic}` },
    });
    const token = typeof body.access_token === "string" ? body.access_token : null;
    if (status !== 200 || !token) {
      throw new MpesaApiError("M-Pesa rejected our credentials.", status);
    }
    const ttlSeconds = Number(body.expires_in) || 3599;
    cachedToken = { value: token, expiresAt: Date.now() + ttlSeconds * 1000, key };
    return token;
  })().finally(() => {
    inflightToken = null;
  });
  return inflightToken;
}

/** Authenticated POST. A 401 clears the cached token and retries once with a fresh one. */
async function authedPost(path: string, payload: unknown, config: MpesaConfig) {
  for (let attempt = 0; ; attempt++) {
    const token = await getAccessToken(config);
    const result = await requestJson(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (result.status === 401 && attempt === 0) {
      clearTokenCache();
      continue;
    }
    return result;
  }
}

/* ---------- STK Push ---------- */

export type StkPushInput = {
  orderId: number;
  /** Already normalised to 2547XXXXXXXX / 2541XXXXXXXX. */
  phone: string;
  /** Whole KES, from the database. */
  amount: number;
};

export type StkPushResult = {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
};

/** Sends the payment prompt to the customer's phone. */
export async function stkPush(input: StkPushInput, config = getMpesaConfig()): Promise<StkPushResult> {
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new MpesaApiError("Invalid payment amount.");
  }
  const timestamp = darajaTimestamp();
  const { status, body } = await authedPost(
    "/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: config.shortcode,
      Password: darajaPassword(config.shortcode, config.passkey, timestamp),
      Timestamp: timestamp,
      TransactionType: config.transactionType,
      Amount: input.amount,
      PartyA: input.phone,
      PartyB: config.partyB,
      PhoneNumber: input.phone,
      CallBackURL: config.callbackUrl,
      AccountReference: `LUXE-${input.orderId}`,
      TransactionDesc: `LUXE ${input.orderId}`.slice(0, 13),
    },
    config
  );

  const ok = status === 200 && String(body.ResponseCode) === "0";
  if (!ok || typeof body.CheckoutRequestID !== "string" || typeof body.MerchantRequestID !== "string") {
    const message = String(body.errorMessage ?? body.ResponseDescription ?? "M-Pesa could not start the payment.");
    throw new MpesaApiError(message, status, typeof body.errorCode === "string" ? body.errorCode : undefined);
  }
  return {
    merchantRequestId: body.MerchantRequestID,
    checkoutRequestId: body.CheckoutRequestID,
    customerMessage: String(body.CustomerMessage ?? "Check your phone and enter your M-Pesa PIN."),
  };
}

/* ---------- STK Query ---------- */

export type StkQueryResult =
  /** The customer has not finished yet, or Daraja is still processing. */
  | { state: "pending" }
  /** Final answer. ResultCode 0 = paid; 1032 = cancelled; anything else = failed. */
  | { state: "final"; resultCode: number; resultDesc: string };

/** Asks Daraja what happened to a prompt, for when the callback never arrived. */
export async function stkQuery(checkoutRequestId: string, config = getMpesaConfig()): Promise<StkQueryResult> {
  const timestamp = darajaTimestamp();
  const { status, body } = await authedPost(
    "/mpesa/stkpushquery/v1/query",
    {
      BusinessShortCode: config.shortcode,
      Password: darajaPassword(config.shortcode, config.passkey, timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    config
  );

  // While the customer is still deciding, Daraja answers with an error (500.001.1001), not a result.
  if (body.ResultCode === undefined || body.ResultCode === null) {
    const code = typeof body.errorCode === "string" ? body.errorCode : undefined;
    if (code === "500.001.1001") return { state: "pending" };
    throw new MpesaApiError(String(body.errorMessage ?? "M-Pesa could not check the payment."), status, code);
  }
  return { state: "final", resultCode: Number(body.ResultCode), resultDesc: String(body.ResultDesc ?? "") };
}
