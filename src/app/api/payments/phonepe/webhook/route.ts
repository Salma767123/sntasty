import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { revalidatePath } from "next/cache";
import {
  getDecryptedPhonePeConfig,
  verifyWebhookAuth,
} from "@/lib/phonepe";
import { claimOrderPaid, finalizePaidOrder } from "@/lib/payment-finalize";

export async function POST(req: Request) {
  try {
    await connectDB();

    const config = await getDecryptedPhonePeConfig();
    if (!config) {
      return NextResponse.json({ success: false, error: "PhonePe not configured" }, { status: 400 });
    }

    if (!config.webhookUsername || !config.webhookPassword) {
      console.error("[PhonePe Webhook] Webhook credentials not configured in admin settings");
      return NextResponse.json(
        { success: false, error: "Webhook credentials not configured" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Missing Authorization header" }, { status: 401 });
    }

    const isValid = verifyWebhookAuth(authHeader, config.webhookUsername, config.webhookPassword);
    if (!isValid) {
      console.error("[PhonePe Webhook] auth verification failed — possible spoof attempt");
      return NextResponse.json({ success: false, error: "Invalid authorization" }, { status: 401 });
    }

    const event = await req.json();
    // V2 webhook envelope: { event: "checkout.order.completed", payload: { ... } }
    const eventType: string = event?.event || event?.type || "";
    const payload: any = event?.payload || event?.data || event;

    const merchantOrderId: string | undefined =
      payload?.merchantOrderId || payload?.merchantTransactionId;
    const state: string | undefined = payload?.state || payload?.status;
    const phonepeTxnId: string | undefined =
      payload?.paymentDetails?.[0]?.transactionId || payload?.orderId;

    if (!merchantOrderId) {
      console.warn("[PhonePe Webhook] Missing merchantOrderId in payload:", event);
      return NextResponse.json({ success: false, error: "Missing merchantOrderId" }, { status: 400 });
    }

    const order = await Order.findOne({
      "paymentResult.id": { $in: [merchantOrderId, phonepeTxnId].filter(Boolean) },
    });

    if (!order) {
      console.log(`ℹ️ [PhonePe Webhook] No order for ${merchantOrderId}`);
      return NextResponse.json({ success: true, status: "noop" });
    }

    const completed =
      state === "COMPLETED" ||
      eventType === "checkout.order.completed" ||
      eventType === "pg.order.completed";

    if (completed) {
      const wonClaim = await claimOrderPaid(String(order._id), {
        id: phonepeTxnId || merchantOrderId,
        status: "completed",
        email_address: order.shippingAddress?.email || "",
      });

      if (wonClaim) {
        console.log(`✅ [PhonePe Webhook] Order ${order._id} marked paid`);
      }
      // Run defensive finalize either way — idempotent
      finalizePaidOrder(String(order._id)).catch((err) =>
        console.error("[PhonePe Webhook] finalize error:", err),
      );
    } else if (state) {
      await Order.findByIdAndUpdate(order._id, {
        "paymentResult.id": phonepeTxnId || merchantOrderId,
        "paymentResult.status": String(state).toLowerCase(),
      });
      console.log(`ℹ️ [PhonePe Webhook] Order ${order._id} state=${state}`);
    }

    revalidatePath("/orders");
    return NextResponse.json({ success: true, status: "ok" });
  } catch (error: any) {
    console.error("PhonePe Webhook Handler Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
