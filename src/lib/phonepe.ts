import crypto from "crypto";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";

/**
 * PhonePe Standard Checkout V2 (OAuth-based)
 * Spec: https://developer.phonepe.com — Standard Checkout
 */

export const PHONEPE_V2_URLS = {
  UAT: {
    auth: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    pay: "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
    status: "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order",
  },
  PROD: {
    auth: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    pay: "https://api.phonepe.com/apis/pg/checkout/v2/pay",
    status: "https://api.phonepe.com/apis/pg/checkout/v2/order",
  },
} as const;

export interface PhonePeUrls {
  auth: string;
  pay: string;
  status: string;
}

export interface PhonePeV2Config {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  env: "UAT" | "PROD";
  urls: PhonePeUrls;
  webhookUsername?: string;
  webhookPassword?: string;
}

export async function getDecryptedPhonePeConfig(): Promise<PhonePeV2Config | null> {
  const config = await Settings.findOne();
  const p = config?.payment;
  if (!p) return null;

  const merchantId = p.phonepeMerchantId || process.env.PHONEPE_MERCHANT_ID || "";
  const clientId = p.phonepeClientId || process.env.PHONEPE_CLIENT_ID || "";

  const clientSecretRaw = p.phonepeClientSecret
    ? decryptPassword(p.phonepeClientSecret)
    : process.env.PHONEPE_CLIENT_SECRET || "";

  if (!merchantId || !clientId || !clientSecretRaw) return null;

  const env: "UAT" | "PROD" =
    p.phonepeEnv === "PROD" || process.env.PHONEPE_ENV === "PROD" ? "PROD" : "UAT";

  const webhookPasswordRaw = p.phonepeWebhookPassword
    ? decryptPassword(p.phonepeWebhookPassword)
    : "";

  return {
    merchantId,
    clientId,
    clientSecret: clientSecretRaw,
    clientVersion: p.phonepeClientVersion || process.env.PHONEPE_CLIENT_VERSION || "1",
    env,
    urls: PHONEPE_V2_URLS[env],
    webhookUsername: p.phonepeWebhookUsername || "",
    webhookPassword: webhookPasswordRaw,
  };
}

/**
 * In-memory token cache (per process). PhonePe tokens last ~1 hour;
 * we refresh 60s before expiry to avoid races.
 */
type CachedToken = { token: string; expiresAt: number };
const tokenCache = new Map<string, CachedToken>();

export async function getAccessToken(config: PhonePeV2Config): Promise<string> {
  const cacheKey = `${config.env}:${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  const now = Math.floor(Date.now() / 1000);

  if (cached && cached.expiresAt - 60 > now) {
    return cached.token;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    client_version: config.clientVersion,
    grant_type: "client_credentials",
  });

  const res = await fetch(config.urls.auth, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    const raw = await res.text().catch(() => "");
    throw new Error(
      `PhonePe OAuth non-JSON response (${res.status}): ${raw.slice(0, 200)}`,
    );
  }

  if (!res.ok || !data?.access_token) {
    const msg = data?.message || data?.error_description || data?.error || "OAuth failed";
    throw new Error(`PhonePe OAuth error: ${msg}`);
  }

  const token: string = data.access_token;
  const expiresAt: number =
    typeof data.expires_at === "number"
      ? data.expires_at
      : now + (typeof data.expires_in === "number" ? data.expires_in : 3600);

  tokenCache.set(cacheKey, { token, expiresAt });
  return token;
}

/**
 * Invalidate a cached token — call this if a 401 is received during an API call.
 */
export function invalidateAccessToken(config: PhonePeV2Config) {
  tokenCache.delete(`${config.env}:${config.clientId}`);
}

/**
 * Verify PhonePe v2 webhook signature.
 * Webhook Auth header = SHA256(username:password) in hex.
 * The username/password are configured separately in PhonePe dashboard for webhook auth.
 *
 * Hardened: trims surrounding whitespace and strips an optional scheme token
 * (e.g. "SHA256 <hash>") before the constant-time hex compare, so minor header
 * formatting differences don't silently reject a genuine webhook.
 */
export function verifyWebhookAuth(
  receivedAuth: string,
  username: string,
  password: string,
): boolean {
  if (!receivedAuth || !username || !password) return false;

  let token = receivedAuth.trim();
  // Strip an optional scheme prefix like "SHA256 " / "Basic " — PhonePe sends the
  // bare hex hash, but some gateways/proxies prepend a scheme. Hex digests have no
  // spaces, so this only ever removes a leading scheme word.
  const spaceIdx = token.indexOf(" ");
  if (spaceIdx > -1) token = token.slice(spaceIdx + 1).trim();

  const expected = crypto
    .createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");

  const a = Buffer.from(expected.toLowerCase());
  const b = Buffer.from(token.toLowerCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface PhonePeStatusResult {
  ok: boolean;
  httpStatus: number;
  /** Normalised PhonePe order state: COMPLETED | PENDING | FAILED | <error marker> */
  state: string;
  phonepeTxnId?: string;
  data: any;
  error?: string;
}

/**
 * Fetch the authoritative order state from PhonePe's Order Status API.
 * Shared by the client callback, the webhook fallback, and the reconciliation cron
 * so every path verifies against the SAME source of truth (the PhonePe API, not a
 * client redirect or a potentially-spoofed webhook payload).
 *
 * Never throws — returns { ok:false, ... } on OAuth/network/parse/HTTP errors so
 * batch callers (cron) can continue past a single failure.
 */
export async function fetchPhonePeOrderStatus(
  config: PhonePeV2Config,
  merchantOrderId: string,
): Promise<PhonePeStatusResult> {
  const statusUrl = `${config.urls.status}/${encodeURIComponent(
    merchantOrderId,
  )}/status?details=true&errorContext=true`;

  let attempt = 0;
  let statusRes: Response | null = null;
  let statusData: any = null;

  while (attempt < 2) {
    attempt += 1;

    let token: string;
    try {
      token = await getAccessToken(config);
    } catch (oauthErr: any) {
      return {
        ok: false,
        httpStatus: 0,
        state: "AUTH_ERROR",
        data: null,
        error: oauthErr?.message || "PhonePe authentication failed",
      };
    }

    try {
      statusRes = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `O-Bearer ${token}`,
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr: any) {
      return {
        ok: false,
        httpStatus: 0,
        state: "NETWORK_ERROR",
        data: null,
        error: fetchErr?.message || "Could not reach PhonePe",
      };
    }

    if (statusRes.status === 401 && attempt < 2) {
      invalidateAccessToken(config);
      continue;
    }

    try {
      statusData = await statusRes.json();
    } catch {
      const raw = await statusRes.text().catch(() => "");
      return {
        ok: false,
        httpStatus: statusRes.status,
        state: "BAD_RESPONSE",
        data: raw.slice(0, 300),
        error: "PhonePe returned a non-JSON response",
      };
    }
    break;
  }

  if (!statusRes || !statusRes.ok) {
    return {
      ok: false,
      httpStatus: statusRes?.status || 0,
      state: String(statusData?.state || "FAILED"),
      data: statusData,
      error: statusData?.message || "Status check failed",
    };
  }

  const state: string = statusData?.state || "FAILED";
  const phonepeTxnId: string | undefined =
    statusData?.paymentDetails?.[0]?.transactionId || statusData?.orderId;

  return { ok: true, httpStatus: statusRes.status, state, phonepeTxnId, data: statusData };
}

export function generateMerchantOrderId(): string {
  // V2 spec: alphanumeric+_-, max 63 chars.
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return `MO${uuid.slice(0, 28)}`;
}
