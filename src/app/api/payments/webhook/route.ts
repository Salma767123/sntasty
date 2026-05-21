import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import {
  claimOrderPaid,
  decrementOrderStock,
  applyCouponUsage,
  claimInvoiceEmail,
  sendOrderEmails,
  releaseInvoiceEmailClaim,
} from "@/lib/payment-finalize";

// Helper: get decrypted webhook secret
async function getDecryptedWebhookSecret() {
  const config = await Settings.findOne();
  if (!config?.payment?.razorpayWebhookSecret) return null;
  return decryptPassword(config.payment.razorpayWebhookSecret);
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "No signature provided" },
        { status: 400 },
      );
    }

    await connectDB();

    const webhookSecret = await getDecryptedWebhookSecret();
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return NextResponse.json(
        { success: false, error: "Webhook secret not configured" },
        { status: 400 },
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(rawBody);
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      console.error("Webhook signature mismatch", {
        expected: digest,
        received: signature,
      });
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 },
      );
    }

    // ─── Handle payment.captured event ───
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const razorpayPaymentId = paymentEntity.id;

      const order = await Order.findOne({ "paymentResult.id": razorpayPaymentId });

      if (order) {
        // Atomic claim — only the winning caller transitions isPaid:false → true.
        // Verify route usually wins (creates order already paid); this is a no-op then.
        await claimOrderPaid(String(order._id), {
          id: razorpayPaymentId,
          status: "completed",
          email_address: paymentEntity.email || "",
        });

        console.log(
          `✅ [Webhook] Order ${order._id} payment captured. Payment ID: ${razorpayPaymentId}`,
        );

        // Defensive finalize: stock + coupon (atomic & idempotent — no-op if verify already did them)
        await Promise.allSettled([
          decrementOrderStock(String(order._id)),
          applyCouponUsage(String(order._id)),
        ]);

        // Atomically claim email sending
        const shouldSend = await claimInvoiceEmail(String(order._id));
        if (shouldSend) {
          try {
            console.log(`📧 [Webhook] Generating invoice for order ${order._id}...`);
            await sendOrderEmails(String(order._id));
            console.log(`✅ [Webhook] Invoice & admin emails sent for order ${order._id}`);
          } catch (emailError) {
            console.error("❌ [Webhook] Failed to send invoice email:", emailError);
            await releaseInvoiceEmailClaim(String(order._id));
          }
        } else {
          console.log(
            `ℹ️ [Webhook] Invoice email already sent for order ${order._id}, skipping.`,
          );
        }
      } else {
        console.log(
          `ℹ️ [Webhook] No order found for payment ${razorpayPaymentId}.`,
        );
      }
    }

    // ─── Handle order.paid event ───
    if (event.event === "order.paid") {
      const paymentEntity = event.payload.payment?.entity;
      if (paymentEntity?.id) {
        const order = await Order.findOne({ "paymentResult.id": paymentEntity.id });
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id: paymentEntity.id,
            status: "completed",
            email_address: "",
          };
          await order.save();
          console.log(
            `✅ [Webhook] Order ${order._id} confirmed via order.paid event.`,
          );
        }
      }
    }

    revalidatePath("/orders");
    return NextResponse.json({ success: true, status: "ok" });
  } catch (error: any) {
    console.error("Webhook Handler Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
