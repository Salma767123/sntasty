import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import Coupon from "@/models/Coupon";
import { decryptPassword } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";
import User from "@/models/User";

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
      orderData,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderData
    ) {
      return NextResponse.json(
        { error: "Missing payment verification or order details" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Verify payment signature
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Signature valid — now create the order in the database
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      couponCode,
      discount,
      customerId,
    } = orderData;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "No order items" }, { status: 400 });
    }

    let userId = session?.user?.id || null;

    // Allow admins to create orders for other customers
    if (customerId && session && (session.user as any).role === "admin") {
      userId = customerId;
    }

    if (userId === "admin-fallback" && session && (session.user as any).role === "admin") {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) userId = adminUser._id.toString();
      else
        return NextResponse.json(
          { error: "No valid admin user found" },
          { status: 400 },
        );
    }

    const order = new Order({
      orderItems: orderItems.map((x: any) => ({
        ...x,
        product: x.productId,
        _id: undefined,
      })),
      user: userId,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      couponCode: couponCode || null,
      discount: discount || 0,
      totalPrice,
      isPaid: true,
      paidAt: new Date(),
      paymentResult: {
        id: razorpay_payment_id,
        status: "completed",
        email_address: "",
      },
    });

    const createdOrder = await order.save();
    console.log(`✅ Payment verified & order created: ${createdOrder._id}`);

    // Update coupon usage if applicable
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          if (userId) {
            const userUsageIndex = coupon.usedByUsers?.findIndex(
              (u: any) => u.userId.toString() === userId
            );
            if (userUsageIndex !== undefined && userUsageIndex >= 0) {
              coupon.usedByUsers[userUsageIndex].count += 1;
              coupon.usedByUsers[userUsageIndex].lastUsedAt = new Date();
            } else {
              if (!coupon.usedByUsers) coupon.usedByUsers = [];
              coupon.usedByUsers.push({
                userId: userId,
                count: 1,
                lastUsedAt: new Date(),
              });
            }
          }
          await coupon.save();
        }
      } catch (couponError) {
        console.error("Failed to update coupon usage:", couponError);
      }
    }

    // Check if webhook is configured (ref repo pattern)
    const hasWebhook =
      paymentConfig?.webhookSecret &&
      paymentConfig.webhookSecret.trim() !== "";

    if (hasWebhook) {
      console.log(
        `✅ Order ${createdOrder._id} created. Webhook will handle invoice email.`,
      );
    } else {
      // No webhook — send email asynchronously (fire and forget)
      console.log(
        `⚠️ No webhook configured. Sending invoice email for order ${createdOrder._id}...`,
      );

      // Fire and forget
      (async () => {
        try {
          const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = await import("@/lib/email-service");
          const populatedOrder = await Order.findById(createdOrder._id).populate("user");

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

          await Order.findByIdAndUpdate(createdOrder._id, {
            invoiceEmailSent: true,
            invoiceEmailSentAt: new Date(),
          });

          console.log(`✅ Invoice & email sent for order ${createdOrder._id}`);
        } catch (emailError) {
          console.error("❌ Failed to send order confirmation email:", emailError);
        }
      })();
    }

    invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG);
    revalidatePath("/orders");

    return NextResponse.json({
      success: true,
      message: "Payment verified and order created",
      orderId: createdOrder._id,
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
