import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import Coupon from "@/models/Coupon";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";

// Lazy load these to avoid build errors
async function getEmailHelpers() {
  try {
    const [invoiceModule, pdfModule, emailModule] = await Promise.all([
      import("@/lib/invoice-generator"),
      import("@/lib/pdf-generator"),
      import("@/lib/email-service"),
    ]);
    return {
      generateInvoiceHTML: invoiceModule.generateInvoiceHTML,
      generatePDFFromHTML: pdfModule.generatePDFFromHTML,
      sendOrderConfirmationEmail: emailModule.sendOrderConfirmationEmail,
    };
  } catch (error) {
    console.error("Failed to load email helpers:", error);
    return null;
  }
}

export async function POST(req: Request) {
  // Wrap everything in try-catch to ensure JSON response
  try {
    console.log("Order creation started");
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("Session retrieved:", session?.user?.id);

    const body = await req.json();
    console.log("Request body parsed");

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
    } = body;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "No order items" }, { status: 400 });
    }

    console.log("Connecting to database");
    await connectDB();
    
    // Inventory management checks have been completely removed.
    // Unlimited orders are now allowed by default.

    // Fix for "admin-fallback" or missing user ID
    let userId = session?.user?.id || null;

    // Allow admins to create orders for other customers
    if (customerId && session && (session.user as any).role === "admin") {
      userId = customerId;
    }

    // If still fallback or invalid (only for admin context logic if needed), try to find a root admin or use a specific system user
    if (userId === "admin-fallback" && session && (session.user as any).role === "admin") {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) userId = adminUser._id.toString();
      else
        return NextResponse.json(
          { error: "No valid admin user found in database to associate order" },
          { status: 400 },
        );
    }

    console.log("Creating order");
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
    });

    const createdOrder = await order.save();
    console.log("Order created:", createdOrder._id);

    // If coupon was used, increment usage count and track per-user usage
    if (couponCode) {
      try {
        console.log("Updating coupon usage");
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        if (coupon) {
          // Increment total usage count
          coupon.usedCount = (coupon.usedCount || 0) + 1;

          // Track per-user usage only if user is logged in
          if (userId) {
            const userUsageIndex = coupon.usedByUsers?.findIndex(
              (u: any) => u.userId.toString() === userId
            );

            if (userUsageIndex !== undefined && userUsageIndex >= 0) {
              // User has used this coupon before, increment their count
              coupon.usedByUsers[userUsageIndex].count += 1;
              coupon.usedByUsers[userUsageIndex].lastUsedAt = new Date();
            } else {
              // First time user is using this coupon
              if (!coupon.usedByUsers) {
                coupon.usedByUsers = [];
              }
              coupon.usedByUsers.push({
                userId: userId,
                count: 1,
                lastUsedAt: new Date(),
              });
            }
          }

          await coupon.save();
          console.log("Coupon usage updated");
        }
      } catch (couponError) {
        console.error("Failed to update coupon usage:", couponError);
        // Don't fail the order if coupon update fails
      }
    }

    // Skip email sending for now to avoid Puppeteer issues in production
    // Email will be sent after payment confirmation via webhook
    console.log("Order creation completed successfully");

    // Invalidate product cache since stock changed
    invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG);
    return NextResponse.json(JSON.parse(JSON.stringify(createdOrder)), { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    console.error("Error stack:", error.stack);
    // Ensure we always return JSON
    return NextResponse.json(
      { 
        error: error.message || "Failed to create order",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({ user: session.user.id })
      .populate({
        path: "orderItems.product",
        select: "slug name",
      })
      .sort({
        createdAt: -1,
      });
    return NextResponse.json(JSON.parse(JSON.stringify(orders)));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
