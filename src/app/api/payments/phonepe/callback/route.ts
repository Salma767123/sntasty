import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { revalidatePath } from "next/cache";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";
import {
  getDecryptedPhonePeConfig,
  getAccessToken,
  invalidateAccessToken,
} from "@/lib/phonepe";
import {
  claimOrderPaid,
  decrementOrderStock,
  applyCouponUsage,
  claimInvoiceEmail,
  sendOrderEmails,
  releaseInvoiceEmailClaim,
} from "@/lib/payment-finalize";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { merchantTransactionId, orderId } = await req.json();

    // For V2, this is actually the merchantOrderId — kept the same query field name for compatibility
    const merchantOrderId = merchantTransactionId;

    if (!merchantOrderId) {
      return NextResponse.json({ error: "merchantOrderId is required" }, { status: 400 });
    }

    const config = await getDecryptedPhonePeConfig();
    if (!config) {
      return NextResponse.json({ error: "PhonePe is not configured" }, { status: 500 });
    }

    const statusUrl = `${config.urls.status}/${encodeURIComponent(merchantOrderId)}/status?details=true&errorContext=true`;

    let attempt = 0;
    let statusRes: Response | null = null;
    let statusData: any = null;

    while (attempt < 2) {
      attempt += 1;
      let token: string;
      try {
        token = await getAccessToken(config);
      } catch (oauthErr: any) {
        console.error("PhonePe OAuth failed during status check:", oauthErr);
        return NextResponse.json(
          { success: false, error: oauthErr.message || "PhonePe authentication failed" },
          { status: 502 },
        );
      }

      try {
        statusRes = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `O-Bearer ${token}`,
          },
          signal: AbortSignal.timeout(15000),
        });
      } catch (fetchErr: any) {
        console.error("PhonePe status network error:", fetchErr);
        return NextResponse.json(
          { success: false, status: "NETWORK_ERROR", error: "Could not reach PhonePe. Please try again." },
          { status: 502 },
        );
      }

      if (statusRes.status === 401 && attempt < 2) {
        invalidateAccessToken(config);
        continue;
      }

      try {
        statusData = await statusRes.json();
      } catch {
        const raw = await statusRes.text().catch(() => "");
        console.error("PhonePe status non-JSON response:", {
          status: statusRes.status,
          body: raw.slice(0, 300),
        });
        return NextResponse.json(
          { success: false, error: "PhonePe returned an unexpected response" },
          { status: 502 },
        );
      }
      break;
    }

    if (!statusRes || !statusRes.ok) {
      console.error("PhonePe status check failed:", statusData);
      return NextResponse.json(
        { success: false, error: statusData?.message || "Status check failed", details: statusData },
        { status: 502 },
      );
    }

    // Prefer the explicit orderId, but fall back to the merchantOrderId lookup if it doesn't
    // resolve (bad/truncated orderId shouldn't dead-end a payment we can still find by mtid).
    let order = orderId ? await Order.findById(orderId).catch(() => null) : null;
    if (!order) {
      order = await Order.findOne({ "paymentResult.id": merchantOrderId });
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Cross-validate: if both orderId AND mtid provided, ensure they belong together.
    // Skip check if order is already paid — paymentResult.id legitimately transitioned
    // to PhonePe's txnId after first successful callback (no exploit possible since
    // claimOrderPaid is gated by isPaid:false).
    if (
      orderId &&
      !order.isPaid &&
      order.paymentResult?.id &&
      order.paymentResult.id !== merchantOrderId
    ) {
      console.warn(
        `[PhonePe callback] orderId/mtid mismatch — order ${order._id} has paymentResult.id=${order.paymentResult.id} but request mtid=${merchantOrderId}`,
      );
      return NextResponse.json(
        { success: false, error: "Order reference mismatch" },
        { status: 400 },
      );
    }

    // Guard against a nested `data.state` so a payload shape change never silently
    // defaults a genuinely COMPLETED payment to FAILED.
    const state: string = statusData?.state || statusData?.data?.state || "FAILED";
    // V2: paymentDetails is an array; first txn is the latest attempt
    const phonepeTxnId: string | undefined =
      statusData?.paymentDetails?.[0]?.transactionId ||
      statusData?.data?.paymentDetails?.[0]?.transactionId ||
      statusData?.orderId ||
      statusData?.data?.orderId;

    // PENDING — async settlement; tell client to retry
    if (state === "PENDING") {
      await Order.findByIdAndUpdate(order._id, {
        "paymentResult.status": "pending",
      });
      return NextResponse.json({
        success: false,
        status: "PENDING",
        message: "Payment is still being processed. Please check your order status shortly.",
        orderId: order._id,
      });
    }

    const paymentSuccess = state === "COMPLETED";

    if (!paymentSuccess) {
      // Record the latest status but KEEP paymentResult.id = the original merchantOrderId.
      // Overwriting it with the PhonePe txnId here would break later lookups by the
      // webhook and the reconciliation sweep (which match on the MO… merchantOrderId).
      await Order.findByIdAndUpdate(order._id, {
        "paymentResult.status": String(state).toLowerCase(),
      });

      return NextResponse.json({
        success: false,
        status: state,
        message: statusData?.message || "Payment was not successful",
        orderId: order._id,
      });
    }

    await claimOrderPaid(String(order._id), {
      id: phonepeTxnId || merchantOrderId,
      status: "completed",
      email_address: order.shippingAddress?.email || "",
    });

    // Await the fast, critical side effects (stock + coupon) so they can't be lost if the
    // process is frozen/killed right after the response. Both are atomic + idempotent, so
    // running them here regardless of who won the paid-claim is safe (no-op if already done).
    const orderIdStr = String(order._id);
    await Promise.allSettled([
      decrementOrderStock(orderIdStr),
      applyCouponUsage(orderIdStr),
    ]);

    // Invoice email is slow (PDF render) — keep it off the response path. Idempotent claim
    // guarantees a single send across callback/webhook/cron.
    (async () => {
      const shouldSend = await claimInvoiceEmail(orderIdStr);
      if (!shouldSend) return;
      try {
        await sendOrderEmails(orderIdStr);
      } catch (err) {
        console.error("[PhonePe callback] invoice email error:", err);
        await releaseInvoiceEmailClaim(orderIdStr);
      }
    })();

    invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG);
    revalidatePath("/orders");

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      orderId: order._id,
      paymentId: phonepeTxnId || merchantOrderId,
    });
  } catch (error: any) {
    console.error("PhonePe Callback Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
