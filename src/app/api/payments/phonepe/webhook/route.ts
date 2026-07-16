import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { revalidatePath } from "next/cache";
import { getDecryptedPhonePeConfig, verifyWebhookAuth } from "@/lib/phonepe";
import { reconcilePhonePeOrder } from "@/lib/phonepe-reconcile";

/**
 * PhonePe Standard Checkout V2 webhook.
 *
 * Hardened behaviour:
 *  - We NEVER trust the webhook payload's "state" to mark an order paid. Instead we
 *    independently re-check the order against PhonePe's Order Status API (via
 *    reconcilePhonePeOrder). This makes a spoofed webhook harmless and also lets the
 *    webhook function before webhook credentials are configured.
 *  - If webhook credentials ARE configured we require a valid Authorization header
 *    (spoof/DoS protection). If they are NOT configured we log loudly and still process
 *    via the independent status check, so payments aren't stranded during setup.
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const config = await getDecryptedPhonePeConfig();
    if (!config) {
      return NextResponse.json(
        { success: false, error: "PhonePe not configured" },
        { status: 400 },
      );
    }

    const credsConfigured = !!(config.webhookUsername && config.webhookPassword);
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization") || "";

    if (credsConfigured) {
      if (!authHeader) {
        return NextResponse.json(
          { success: false, error: "Missing Authorization header" },
          { status: 401 },
        );
      }
      const isValid = verifyWebhookAuth(
        authHeader,
        config.webhookUsername!,
        config.webhookPassword!,
      );
      if (!isValid) {
        console.error("[PhonePe Webhook] auth verification failed — possible spoof attempt");
        return NextResponse.json(
          { success: false, error: "Invalid authorization" },
          { status: 401 },
        );
      }
    } else {
      console.warn(
        "[PhonePe Webhook] Webhook credentials not configured — processing via independent " +
          "status verification. Configure phonepeWebhookUsername/Password in Admin Settings and " +
          "register them in the PhonePe dashboard to enable authenticated webhooks.",
      );
    }

    const event = await req.json();
    // V2 envelope: { event: "checkout.order.completed", payload: { merchantOrderId, state, ... } }
    const payload: any = event?.payload || event?.data || event;

    const merchantOrderId: string | undefined =
      payload?.merchantOrderId || payload?.merchantTransactionId;
    const phonepeTxnId: string | undefined =
      payload?.paymentDetails?.[0]?.transactionId || payload?.orderId;
    // initiate() stuffs the Mongo order _id into metaInfo.udf1 — most reliable join key.
    const udf1: string | undefined = payload?.metaInfo?.udf1;

    // Locate the order: prefer the explicit udf1 (Mongo _id), then the MO id / txn id.
    let order = null as any;
    if (udf1) {
      order = await Order.findById(udf1).catch(() => null);
    }
    if (!order) {
      const ids = [merchantOrderId, phonepeTxnId].filter(Boolean);
      if (ids.length) {
        order = await Order.findOne({ "paymentResult.id": { $in: ids } });
      }
    }

    if (!order) {
      console.log(
        `ℹ️ [PhonePe Webhook] No order for merchantOrderId=${merchantOrderId} udf1=${udf1}`,
      );
      return NextResponse.json({ success: true, status: "noop" });
    }

    // Independently verify against PhonePe and finalize if genuinely COMPLETED (idempotent).
    const result = await reconcilePhonePeOrder(String(order._id));

    if (result.outcome === "marked_paid") {
      console.log(`✅ [PhonePe Webhook] Order ${order._id} verified COMPLETED and marked paid`);
    } else if (result.outcome === "already_paid") {
      console.log(`ℹ️ [PhonePe Webhook] Order ${order._id} already paid`);
    } else {
      console.log(
        `ℹ️ [PhonePe Webhook] Order ${order._id} not marked paid (outcome=${result.outcome} state=${result.state || "?"})`,
      );
    }

    revalidatePath("/orders");

    // Retry semantics: a webhook can arrive a moment before PhonePe's own status API flips
    // to COMPLETED, or the status check can transiently fail. In those non-terminal cases we
    // return a 5xx so PhonePe REDELIVERS the webhook instead of considering it handled.
    // Terminal outcomes (paid / genuinely failed / unknown order) return 2xx = done.
    const retryable =
      result.outcome === "pending" ||
      result.outcome === "status_error" ||
      result.outcome === "config_missing";

    if (retryable) {
      return NextResponse.json(
        { success: false, status: "retry", outcome: result.outcome },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, status: "ok", outcome: result.outcome });
  } catch (error: any) {
    console.error("PhonePe Webhook Handler Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
