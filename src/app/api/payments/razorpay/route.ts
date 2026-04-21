import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import Order from "@/models/Order";
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await connectDB();
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order ownership
    if (order.user) {
      // If order belongs to a user, they must be logged in and be the owner (or admin)
      if (!session || (order.user.toString() !== session.user.id && (session.user as any).role !== "admin")) {
        return NextResponse.json(
          { error: "Unauthorized access to order" },
          { status: 403 },
        );
      }
    } else {
      // It's a guest order. For now, we allow payment if you have the ID.
      // In a more secure implementation, we could verify the email here as well.
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

    const amount = order.totalPrice;
    const currency = "INR";

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${order._id}`,
      notes: {
        orderId: order._id.toString(),
      },
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
