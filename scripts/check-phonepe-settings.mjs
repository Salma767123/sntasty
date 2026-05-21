// Dump current PhonePe settings from DB
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

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

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const settings = await db.collection("settings").findOne({});

console.log("=== Settings.payment ===");
const p = settings?.payment || {};
console.log(JSON.stringify({
  activeGateway: p.activeGateway,
  phonepeMerchantId: p.phonepeMerchantId,
  phonepeClientId: p.phonepeClientId,
  phonepeClientSecret: p.phonepeClientSecret ? `<encrypted ${p.phonepeClientSecret.length} chars>` : "MISSING",
  phonepeClientVersion: p.phonepeClientVersion,
  phonepeEnv: p.phonepeEnv,
  phonepeWebhookUsername: p.phonepeWebhookUsername,
  phonepeWebhookPassword: p.phonepeWebhookPassword ? "SET" : "MISSING",
  // Legacy V1 fields (should be undefined)
  phonepeSaltKey: p.phonepeSaltKey,
  phonepeSaltIndex: p.phonepeSaltIndex,
}, null, 2));

await mongoose.disconnect();
process.exit(0);
