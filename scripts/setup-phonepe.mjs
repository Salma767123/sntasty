// One-off script: configure PhonePe V2 credentials in Settings collection.
// Usage:  node scripts/setup-phonepe.mjs
// Reads from .env.local. Encrypts Client Secret before storing.

import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Load .env.local explicitly
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const ENCRYPTION_KEY =
  process.env.BETTER_AUTH_SECRET || "default-encryption-key-change-this";
const ALGORITHM = "aes-256-cbc";

function encryptPassword(plain) {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plain, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

const merchantId = process.env.PHONEPE_MERCHANT_ID;
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
const phonepeEnv = process.env.PHONEPE_ENV || "PROD";

if (!merchantId || !clientId || !clientSecret) {
  console.error("Missing PhonePe credentials in .env.local");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const encryptedSecret = encryptPassword(clientSecret);

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const settings = await db
  .collection("settings")
  .findOneAndUpdate(
    {},
    {
      $set: {
        "payment.activeGateway": "both",
        "payment.phonepeMerchantId": merchantId,
        "payment.phonepeClientId": clientId,
        "payment.phonepeClientSecret": encryptedSecret,
        "payment.phonepeClientVersion": clientVersion,
        "payment.phonepeEnv": phonepeEnv,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

console.log("✅ PhonePe V2 settings saved");
console.log("  activeGateway:", settings.value?.payment?.activeGateway || "both");
console.log("  merchantId:", settings.value?.payment?.phonepeMerchantId || merchantId);
console.log("  clientId:", settings.value?.payment?.phonepeClientId || clientId);
console.log("  env:", settings.value?.payment?.phonepeEnv || phonepeEnv);
console.log("  clientSecret: <encrypted, length=" + encryptedSecret.length + ">");

await mongoose.disconnect();
process.exit(0);
