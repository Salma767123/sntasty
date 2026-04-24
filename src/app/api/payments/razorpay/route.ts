import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";

// Helper: get decrypted payment config from DB (exact ref repo pattern)
async function getDecryptedPaymentConfig() {
  const config = await Settings.findOne();
  if (!config?.payment?.razorpayKeyId) return null;

  return {
    keyId: config.payment.razorpayKeyId,
    keySecret: config.payment.razorpayKeySecret
      ? decryptPassword(config.payment.razorpayKeySecret)
      : null,
  };
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    // Get decrypted payment config (exact ref repo pattern)
    const paymentConfig = await getDecryptedPaymentConfig();

    const key_id = paymentConfig?.keyId || process.env.RAZORPAY_KEY_ID;
    const key_secret =
      paymentConfig?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        {
          error:
            "Payment configuration not found. Please configure Razorpay keys in Admin Settings.",
        },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    try {
      const rzpOrder = await razorpay.orders.create(options);
      return NextResponse.json({
        ...rzpOrder,
        key: key_id,
      });
    } catch (rzpError: any) {
      console.error("Razorpay SDK Error:", rzpError);
      return NextResponse.json(
        { error: rzpError.error?.description || "Razorpay SDK Error" },
        { status: 502 },
      );
    }
  } catch (error: any) {
    console.error("Payment Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
