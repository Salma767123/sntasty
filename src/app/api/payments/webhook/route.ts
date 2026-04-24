import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
// Dynamic imports used below to avoid crashing on servers without chromium
import { revalidatePath } from "next/cache";

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

      // Find the order by the razorpay payment ID stored in paymentResult
      const order = await Order.findOne({ "paymentResult.id": razorpayPaymentId });

      if (order) {
        // Order already exists (created by verify route), handle email
        if (!order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id: razorpayPaymentId,
            status: "completed",
            email_address: paymentEntity.email || "",
          };
          await order.save();
        }

        console.log(
          `✅ [Webhook] Order ${order._id} payment captured. Payment ID: ${razorpayPaymentId}`,
        );

        // Atomically claim the email sending task (ref repo pattern)
        const claimedOrder = await Order.findOneAndUpdate(
          {
            _id: order._id,
            invoiceEmailSent: false,
          },
          {
            invoiceEmailSent: true,
            invoiceEmailSentAt: new Date(),
          },
          { new: false },
        );

        // If claimedOrder is not null, we successfully claimed it
        if (claimedOrder && !claimedOrder.invoiceEmailSent) {
          try {
            const populatedOrder =
              await Order.findById(order._id).populate("user");
            console.log(
              `📧 [Webhook] Generating invoice for order ${order._id}...`,
            );
            const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = await import("@/lib/email-service");

            let pdfBuffer = null;
            try {
              const { generateInvoiceHTML } = await import("@/lib/invoice-generator");
              const { generatePDFFromHTML } = await import("@/lib/pdf-generator");
              const invoiceHTML = await generateInvoiceHTML(populatedOrder);
              pdfBuffer = await generatePDFFromHTML(invoiceHTML);
            } catch (pdfError) {
              console.warn("⚠️ PDF generation failed, sending email without attachment:", (pdfError as Error).message);
            }

            await sendOrderConfirmationEmail(populatedOrder, pdfBuffer);
            await sendAdminNewOrderEmail(populatedOrder, pdfBuffer);

            console.log(
              `✅ [Webhook] Invoice & Admin emails sent for order ${order._id}`,
            );
          } catch (emailError) {
            console.error(
              "❌ [Webhook] Failed to send invoice email:",
              emailError,
            );
            // Rollback the flag if email failed
            await Order.findByIdAndUpdate(order._id, {
              invoiceEmailSent: false,
              invoiceEmailSentAt: null,
            });
          }
        } else {
          console.log(
            `ℹ️ [Webhook] Invoice email already sent for order ${order._id}, skipping.`,
          );
        }
      } else {
        console.log(
          `ℹ️ [Webhook] No order found for payment ${razorpayPaymentId}. It may not have been created yet.`,
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
