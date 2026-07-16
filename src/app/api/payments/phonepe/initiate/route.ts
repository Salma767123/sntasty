import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getDecryptedPhonePeConfig,
  getAccessToken,
  invalidateAccessToken,
  generateMerchantOrderId,
} from "@/lib/phonepe";

export async function POST(req: Request) {
  let pendingOrderId: string | null = null;
  let succeeded = false;
  // True once PhonePe has ACCEPTED the pay request (2xx). From that point a payment session
  // may exist on PhonePe's side, so we must NOT delete the order even if a later step fails —
  // the reconciliation cron/webhook can still recover it.
  let phonepeAccepted = false;

  try {
    await connectDB();

    const { amount, orderData } = await req.json();

    if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }
    if (Math.round(amount * 100) < 100) {
      return NextResponse.json({ error: "Minimum order amount is ₹1" }, { status: 400 });
    }
    if (!orderData || !orderData.orderItems || orderData.orderItems.length === 0) {
      return NextResponse.json({ error: "Order data with items is required" }, { status: 400 });
    }
    if (!orderData.shippingAddress?.email || !orderData.shippingAddress?.phone) {
      return NextResponse.json(
        { error: "Shipping address requires email and phone" },
        { status: 400 },
      );
    }
    for (const item of orderData.orderItems) {
      if (!Number.isFinite(item.qty) || item.qty <= 0) {
        return NextResponse.json(
          { error: "Order items must have valid positive quantities" },
          { status: 400 },
        );
      }
    }

    const settingsDoc = await Settings.findOne();
    const activeGateway = settingsDoc?.payment?.activeGateway || "razorpay";
    if (activeGateway !== "phonepe" && activeGateway !== "both") {
      return NextResponse.json(
        { error: "PhonePe is not enabled for this store" },
        { status: 403 },
      );
    }

    const config = await getDecryptedPhonePeConfig();
    if (!config) {
      return NextResponse.json(
        { error: "PhonePe is not configured. Please configure credentials in Admin Settings." },
        { status: 500 },
      );
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "";

    if (!origin || !/^https?:\/\//.test(origin)) {
      return NextResponse.json(
        {
          error:
            "Server origin could not be determined. Configure NEXT_PUBLIC_APP_URL in environment.",
        },
        { status: 500 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    let userId: string | null = session?.user?.id || null;
    if (orderData.customerId && session && (session.user as any).role === "admin") {
      userId = orderData.customerId;
    }
    if (userId === "admin-fallback" && session && (session.user as any).role === "admin") {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) userId = adminUser._id.toString();
      else
        return NextResponse.json({ error: "No valid admin user found" }, { status: 400 });
    }

    const merchantOrderId = generateMerchantOrderId();

    const pendingOrder = await Order.create({
      orderItems: orderData.orderItems.map((x: any) => ({
        name: x.name,
        qty: x.qty,
        image: x.image,
        price: x.price,
        uom: x.uom,
        product: x.productId,
      })),
      user: userId,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: "PhonePe",
      itemsPrice: orderData.itemsPrice,
      taxPrice: orderData.taxPrice || 0,
      shippingPrice: orderData.shippingPrice || 0,
      discountPrice: orderData.discountPrice || 0,
      couponCode: orderData.couponCode || null,
      discount: orderData.discount || 0,
      totalWeight: orderData.totalWeight || 0,
      totalPrice: orderData.totalPrice,
      status: "Pending",
      isPaid: false,
      paymentResult: {
        id: merchantOrderId,
        status: "initiated",
        email_address: orderData.shippingAddress?.email || "",
      },
    });
    pendingOrderId = String(pendingOrder._id);

    const redirectUrl = `${origin}/checkout/phonepe-callback?orderId=${pendingOrder._id}&mtid=${merchantOrderId}`;

    const payBody = {
      merchantOrderId,
      amount: Math.round(amount * 100),
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: String(pendingOrder._id),
        udf2: orderData.shippingAddress?.email || "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: `Order ${pendingOrder._id}`,
        merchantUrls: {
          redirectUrl,
        },
      },
    };

    // Two attempts: first with cached token, retry once if 401 (token expired/rotated)
    let attempt = 0;
    let phonepeRes: Response | null = null;
    let phonepeData: any = null;
    let lastErr: any = null;

    while (attempt < 2) {
      attempt += 1;
      let token: string;
      try {
        token = await getAccessToken(config);
      } catch (oauthErr: any) {
        lastErr = oauthErr;
        console.error("PhonePe OAuth failed:", oauthErr);
        return NextResponse.json(
          { error: oauthErr.message || "PhonePe authentication failed" },
          { status: 502 },
        );
      }

      try {
        phonepeRes = await fetch(config.urls.pay, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `O-Bearer ${token}`,
          },
          body: JSON.stringify(payBody),
          signal: AbortSignal.timeout(15000),
        });
      } catch (networkErr: any) {
        console.error("PhonePe network error:", networkErr);
        return NextResponse.json(
          { error: "Could not reach PhonePe. Please try again." },
          { status: 502 },
        );
      }

      if (phonepeRes.status === 401 && attempt < 2) {
        invalidateAccessToken(config);
        continue;
      }

      try {
        phonepeData = await phonepeRes.json();
      } catch {
        const rawText = await phonepeRes.text().catch(() => "");
        console.error("PhonePe non-JSON response:", {
          status: phonepeRes.status,
          body: rawText.slice(0, 500),
        });
        return NextResponse.json(
          { error: "PhonePe returned an unexpected response" },
          { status: 502 },
        );
      }

      break;
    }

    if (!phonepeRes || !phonepeRes.ok) {
      console.error("PhonePe pay failed:", { status: phonepeRes?.status, data: phonepeData });
      return NextResponse.json(
        {
          error: phonepeData?.message || phonepeData?.error || "PhonePe payment initiation failed",
          code: phonepeData?.code,
        },
        { status: 502 },
      );
    }

    // PhonePe returned 2xx — a payment session may now exist; keep the order regardless of
    // what happens next.
    phonepeAccepted = true;

    const payUrl: string | undefined = phonepeData?.redirectUrl;
    if (!payUrl) {
      console.error("PhonePe pay response missing redirectUrl:", phonepeData);
      return NextResponse.json(
        { error: "PhonePe redirect URL not returned" },
        { status: 502 },
      );
    }

    succeeded = true;
    return NextResponse.json({
      success: true,
      redirectUrl: payUrl,
      merchantTransactionId: merchantOrderId,
      orderId: pendingOrder._id,
    });
  } catch (error: any) {
    console.error("PhonePe Initiate Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    // Only delete the freshly-created order if we bailed BEFORE PhonePe accepted it. Once
    // PhonePe has a session, deleting would strand a potentially-real payment with no order.
    if (pendingOrderId && !succeeded && !phonepeAccepted) {
      try {
        await Order.findByIdAndDelete(pendingOrderId);
      } catch (cleanupErr) {
        console.error("[PhonePe Initiate] Failed to cleanup pending order:", cleanupErr);
      }
    }
  }
}
