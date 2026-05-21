// One-off: remove pending PhonePe test orders created by curl smoke tests.
import "dotenv/config";
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

const res = await db.collection("orders").deleteMany({
  paymentMethod: "PhonePe",
  isPaid: false,
  "shippingAddress.email": "test@example.com",
});

console.log(`✅ Deleted ${res.deletedCount} pending test orders`);
await mongoose.disconnect();
process.exit(0);
