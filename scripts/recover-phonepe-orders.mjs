/**
 * One-off recovery for PhonePe orders that were genuinely paid but stuck on isPaid=false
 * (customer never returned to the callback page AND no webhook/cron marked them paid).
 *
 * Self-contained (raw MongoDB driver) so it runs with plain `node` — it mirrors the exact
 * finalize logic in src/lib/payment-finalize.ts: atomic "mark paid" claim, variant-aware
 * stock decrement (+ StockTransaction log), and coupon usage — all idempotent via the same
 * stockDecremented / couponApplied flags.
 *
 * Usage (run from project root):
 *
 *   # SAFE preview — checks PhonePe status for each stuck order, changes NOTHING:
 *   node scripts/recover-phonepe-orders.mjs
 *
 *   # Actually recover every order PhonePe reports as COMPLETED (marks paid + stock + coupon):
 *   node scripts/recover-phonepe-orders.mjs --confirm
 *
 *   # Target a single order:
 *   node scripts/recover-phonepe-orders.mjs --order=<ORDER_ID> --confirm
 *
 *   # Only consider orders from the last N hours (default: all ages):
 *   node scripts/recover-phonepe-orders.mjs --hours=72
 *
 * NOTE: this script does NOT send the confirmation email (nodemailer/templates live in the
 * app runtime). To also email the customer, use the in-app admin "Re-check PhonePe Payment"
 * button — it runs the full finalize incl. email. This script is for fast/bulk data recovery.
 */
import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// ---------- load .env.local ----------
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}

const argv = process.argv.slice(2);
const confirm = argv.includes("--confirm");
const orderArg = argv.find((a) => a.startsWith("--order="))?.split("=")[1];
const hoursArg = argv.find((a) => a.startsWith("--hours="))?.split("=")[1];
const hours = hoursArg ? Number(hoursArg) : null;

// ---------- crypto (mirrors src/lib/encryption.ts) ----------
const ENCRYPTION_KEY = process.env.BETTER_AUTH_SECRET || "default-encryption-key-change-this";
function decryptPassword(value) {
  try {
    if (!value || !value.includes(":")) return value || "";
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const [ivHex, enc] = value.split(":");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
    let out = decipher.update(enc, "hex", "utf8");
    out += decipher.final("utf8");
    return out;
  } catch {
    return "";
  }
}

// ---------- PhonePe V2 (mirrors src/lib/phonepe.ts) ----------
const PHONEPE_URLS = {
  UAT: {
    auth: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    status: "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order",
  },
  PROD: {
    auth: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    status: "https://api.phonepe.com/apis/pg/checkout/v2/order",
  },
};

function buildConfig(settings) {
  const p = settings?.payment || {};
  const merchantId = p.phonepeMerchantId || process.env.PHONEPE_MERCHANT_ID || "";
  const clientId = p.phonepeClientId || process.env.PHONEPE_CLIENT_ID || "";
  // Prefer the DB-encrypted secret; if it can't be decrypted here (e.g. a different
  // BETTER_AUTH_SECRET than the one that encrypted it), fall back to the env value.
  let clientSecret = p.phonepeClientSecret ? decryptPassword(p.phonepeClientSecret) : "";
  if (!clientSecret) clientSecret = process.env.PHONEPE_CLIENT_SECRET || "";
  if (!merchantId || !clientId || !clientSecret) return null;
  const env =
    p.phonepeEnv === "PROD" || process.env.PHONEPE_ENV === "PROD" ? "PROD" : "UAT";
  return {
    clientId,
    clientSecret,
    clientVersion: p.phonepeClientVersion || process.env.PHONEPE_CLIENT_VERSION || "1",
    env,
    urls: PHONEPE_URLS[env],
  };
}

let cachedToken = null;
async function getAccessToken(config) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    client_version: String(config.clientVersion),
    grant_type: "client_credentials",
  });
  const res = await fetch(config.urls.auth, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data?.access_token) {
    throw new Error(`OAuth failed: ${data?.message || data?.error_description || res.status}`);
  }
  const expiresAt =
    typeof data.expires_at === "number" ? data.expires_at : now + (data.expires_in || 3600);
  cachedToken = { token: data.access_token, expiresAt };
  return cachedToken.token;
}

async function fetchStatus(config, merchantOrderId) {
  if (!merchantOrderId) return { ok: false, state: "NO_MTID", error: "missing merchantOrderId" };
  const url = `${config.urls.status}/${encodeURIComponent(merchantOrderId)}/status?details=true&errorContext=true`;
  let token;
  try {
    token = await getAccessToken(config);
  } catch (e) {
    return { ok: false, state: "AUTH_ERROR", error: e.message };
  }
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json", Authorization: `O-Bearer ${token}` },
    });
  } catch (e) {
    return { ok: false, state: "NETWORK_ERROR", error: e.message };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, state: "BAD_RESPONSE", httpStatus: res.status };
  }
  if (!res.ok) return { ok: false, state: String(data?.state || "FAILED"), error: data?.message, data };
  const state = data?.state || "FAILED";
  const phonepeTxnId = data?.paymentDetails?.[0]?.transactionId || data?.orderId;
  return { ok: true, state, phonepeTxnId, data };
}

// ---------- finalize (mirrors src/lib/payment-finalize.ts), raw driver ----------
async function claimPaid(db, order, phonepeTxnId) {
  const before = await db.collection("orders").findOneAndUpdate(
    { _id: order._id, isPaid: false },
    {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        "paymentResult.id": phonepeTxnId || order.paymentResult?.id,
        "paymentResult.status": "completed",
        "paymentResult.email_address": order.shippingAddress?.email || "",
      },
    },
    { returnDocument: "before" },
  );
  // Driver may return the doc directly or { value: doc } depending on version.
  const doc = before && before.value !== undefined ? before.value : before;
  return !!(doc && doc.isPaid === false);
}

async function decrementStock(db, orderId) {
  const before = await db.collection("orders").findOneAndUpdate(
    { _id: orderId, isPaid: true, stockDecremented: { $ne: true } },
    { $set: { stockDecremented: true } },
    { returnDocument: "before" },
  );
  const claimed = before && before.value !== undefined ? before.value : before;
  if (!claimed || claimed.stockDecremented === true) return false;

  for (const item of claimed.orderItems || []) {
    const qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const product = await db.collection("products").findOne({ _id: item.product });
    if (!product) continue;
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    if (hasVariants) {
      if (!item.uom) continue;
      const idx = product.variants.findIndex((v) => v.uom === item.uom);
      if (idx === -1) continue;
      const prev = product.variants[idx].stock || 0;
      const next = Math.max(0, prev - qty);
      const set = {};
      set[`variants.${idx}.stock`] = next;
      await db.collection("products").updateOne({ _id: product._id }, { $set: set });
      await insertStockTxn(db, product, item.uom, qty, prev, next, orderId);
    } else {
      const prev = product.stock || 0;
      const next = Math.max(0, prev - qty);
      await db.collection("products").updateOne({ _id: product._id }, { $set: { stock: next } });
      await insertStockTxn(db, product, undefined, qty, prev, next, orderId);
    }
  }
  return true;
}

async function insertStockTxn(db, product, variantSku, qty, prev, next, orderId) {
  try {
    const doc = {
      product: product._id,
      productName: product.name,
      type: "Sale",
      quantity: -qty,
      previousStock: prev,
      newStock: next,
      reference: String(orderId),
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (variantSku) doc.variantSku = variantSku;
    await db.collection("stocktransactions").insertOne(doc);
  } catch {
    /* non-fatal */
  }
}

async function applyCoupon(db, orderId) {
  const before = await db.collection("orders").findOneAndUpdate(
    { _id: orderId, isPaid: true, couponApplied: { $ne: true }, couponCode: { $ne: null } },
    { $set: { couponApplied: true } },
    { returnDocument: "before" },
  );
  const claimed = before && before.value !== undefined ? before.value : before;
  if (!claimed || claimed.couponApplied === true || !claimed.couponCode) return false;

  const coupon = await db
    .collection("coupons")
    .findOne({ code: String(claimed.couponCode).toUpperCase() });
  if (!coupon) return false;

  const update = { $inc: { usedCount: 1 } };
  if (claimed.user) {
    const users = coupon.usedByUsers || [];
    const idx = users.findIndex((u) => String(u.userId) === String(claimed.user));
    if (idx >= 0) {
      const set = {};
      set[`usedByUsers.${idx}.count`] = (users[idx].count || 0) + 1;
      set[`usedByUsers.${idx}.lastUsedAt`] = new Date();
      await db.collection("coupons").updateOne({ _id: coupon._id }, { $set: set, $inc: { usedCount: 1 } });
      return true;
    } else {
      update.$push = { usedByUsers: { userId: claimed.user, count: 1, lastUsedAt: new Date() } };
    }
  }
  await db.collection("coupons").updateOne({ _id: coupon._id }, update);
  return true;
}

// ---------- main ----------
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const settings = await db.collection("settings").findOne({});
  const config = buildConfig(settings);
  if (!config) {
    console.error("PhonePe is not configured in Settings — cannot check status. Aborting.");
    process.exit(1);
  }

  const query = { paymentMethod: "PhonePe", isPaid: false };
  if (orderArg) {
    try {
      query._id = new mongoose.Types.ObjectId(orderArg);
    } catch {
      console.error(`Invalid --order id: ${orderArg}`);
      process.exit(1);
    }
  }
  if (hours && Number.isFinite(hours)) {
    query.createdAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
  }

  const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray();

  console.log(`\nPhonePe env: ${config.env}`);
  console.log(`Found ${orders.length} unpaid PhonePe order(s).`);
  console.log(confirm ? "MODE: --confirm (will mark paid + stock + coupon)\n" : "MODE: dry-run preview (no changes)\n");

  let completed = 0, pending = 0, failed = 0, errored = 0, recovered = 0;

  for (const o of orders) {
    const id = String(o._id);
    const mtid = o.paymentResult?.id || "";
    const created = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 16) : "?";
    const st = await fetchStatus(config, mtid);
    const stateTag = st.ok ? st.state : `ERROR(${st.state}${st.error ? ": " + st.error : ""})`;

    if (!confirm) {
      console.log(`• ${id}  ₹${o.totalPrice}  ${created}  mtid=${mtid || "(none)"}  ->  ${stateTag}`);
      if (st.ok && st.state === "COMPLETED") completed++;
      else if (st.ok && st.state === "PENDING") pending++;
      else if (st.ok) failed++;
      else errored++;
      continue;
    }

    if (!st.ok) {
      console.log(`• ${id}  ->  SKIP (${stateTag})`);
      errored++;
      continue;
    }
    if (st.state === "COMPLETED") {
      const won = await claimPaid(db, o, st.phonepeTxnId);
      await decrementStock(db, o._id);
      await applyCoupon(db, o._id);
      console.log(`• ${id}  ₹${o.totalPrice}  ->  MARKED PAID${won ? "" : " (was already paid)"}`);
      recovered++;
    } else if (st.state === "PENDING") {
      await db.collection("orders").updateOne({ _id: o._id }, { $set: { "paymentResult.status": "pending" } });
      console.log(`• ${id}  ->  still PENDING (left unpaid)`);
      pending++;
    } else {
      await db.collection("orders").updateOne(
        { _id: o._id },
        { $set: { "paymentResult.status": String(st.state).toLowerCase() } },
      );
      console.log(`• ${id}  ->  ${st.state} (left unpaid)`);
      failed++;
    }
  }

  if (!confirm) {
    console.log(`\nSummary (PhonePe says): COMPLETED=${completed}  PENDING=${pending}  FAILED=${failed}  errors=${errored}`);
    if (completed > 0) console.log(`\nRe-run with --confirm to recover the ${completed} COMPLETED order(s).`);
  } else {
    console.log(`\nSummary: recovered(paid)=${recovered}  pending=${pending}  failed=${failed}  errors=${errored}`);
    console.log(`(To email customers their confirmation, use the in-app "Re-check PhonePe Payment" button.)`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("recover-phonepe-orders fatal error:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
