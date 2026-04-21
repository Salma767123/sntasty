import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

// Helper: get decrypted payment config from DB (exact ref repo pattern)
async function getDecryptedPaymentConfig() {
  const config = await Settings.findOne();
  if (!config?.payment?.razorpayKeyId) return null;

  return {
    keyId: config.payment.razorpayKeyId,
    keySecret: config.payment.razorpayKeySecret
      ? decryptPassword(config.payment.razorpayKeySecret)
      : null,
    webhookSecret: config.payment.razorpayWebhookSecret
      ? decryptPassword(config.payment.razorpayWebhookSecret)
      : null,
  };
}

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details" },
        { status: 400 },
      );
    }

    await connectDB();

    // Get decrypted config (exact ref repo pattern)
    const paymentConfig = await getDecryptedPaymentConfig();
    const key_secret =
      paymentConfig?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error("RAZORPAY_KEY_SECRET is missing");
      return NextResponse.json(
        { error: "Payment config missing" },
        { status: 500 },
      );
    }

    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: "completed",
        email_address: "",
      };
      await order.save();

      // Check if webhook is configured (ref repo pattern)
      const hasWebhook =
        paymentConfig?.webhookSecret &&
        paymentConfig.webhookSecret.trim() !== "";

      if (hasWebhook) {
        console.log(
          `✅ Payment verified for order ${order._id}. Webhook will handle invoice email.`,
        );
      } else {
        // No webhook configured - send email asynchronously (fire and forget)
        console.log(
          `⚠️ No webhook configured. Sending invoice email asynchronously for order ${order._id}...`,
        );

        if (!order.invoiceEmailSent) {
          // Fire and forget - don't await this
          (async () => {
            try {
              const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = await import("@/lib/email-service");

              const populatedOrder =
                await Order.findById(orderId).populate("user");
              console.log(
                `📧 Sending confirmation email for order ${order._id}...`,
              );

              // Try PDF generation, but send email without it if it fails (e.g. no chromium on Hostinger)
              let pdfBuffer = null;
              try {
                const { generateInvoiceHTML } = await import("@/lib/invoice-generator");
                const { generatePDFFromHTML } = await import("@/lib/pdf-generator");
                const invoiceHTML = await generateInvoiceHTML(populatedOrder);
                pdfBuffer = await generatePDFFromHTML(invoiceHTML);
              } catch (pdfError) {
                console.warn("⚠️ PDF generation failed (no chromium?), sending email without attachment:", (pdfError as Error).message);
              }

              await sendOrderConfirmationEmail(populatedOrder, pdfBuffer);
              
              // Send the explicit admin notification email
              await sendAdminNewOrderEmail(populatedOrder, pdfBuffer);

              // Mark email as sent
              const orderToUpdate = await Order.findById(orderId);
              if (orderToUpdate) {
                orderToUpdate.invoiceEmailSent = true;
                orderToUpdate.invoiceEmailSentAt = new Date();
                await orderToUpdate.save();
              }

              console.log(
                `✅ Invoice generated and email sent for order ${order._id}`,
              );
            } catch (emailError) {
              console.error(
                "❌ Failed to send order confirmation email:",
                emailError,
              );
            }
          })();
        } else {
          console.log(
            `ℹ️ Invoice email already sent for order ${order._id}, skipping.`,
          );
        }
      }

      revalidatePath("/orders");
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        orderId: order._id,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
