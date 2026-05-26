import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendStatusUpdateEmail } from "@/lib/email-service";
import { reinstateOrderStock, reverseCouponUsage } from "@/lib/payment-finalize";
import { revalidatePath } from "next/cache";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason: string = (body.reason || "").toString().trim();

    if (!reason) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 },
      );
    }
    if (reason.length > 500) {
      return NextResponse.json(
        { error: "Cancellation reason is too long (max 500 chars)" },
        { status: 400 },
      );
    }

    await connectDB();

    // Honour the admin setting
    const settings = await Settings.findOne();
    if (settings?.allowOrderCancellation === false) {
      return NextResponse.json(
        { error: "Order cancellation is disabled in settings" },
        { status: 403 },
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "Cancelled") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 },
      );
    }

    if (order.status === "Delivered") {
      return NextResponse.json(
        { error: "Delivered orders cannot be cancelled. Please process a return instead." },
        { status: 400 },
      );
    }

    // Atomically transition to Cancelled (only succeeds if not already cancelled/delivered)
    const cancelled = await Order.findOneAndUpdate(
      {
        _id: id,
        status: { $nin: ["Cancelled", "Delivered"] },
      },
      {
        $set: {
          status: "Cancelled",
          cancelledAt: new Date(),
          cancelReason: reason,
          cancelledBy: session.user.id,
          refundStatus: order.isPaid ? "manual_pending" : "not_applicable",
        },
      },
      { new: true },
    );

    if (!cancelled) {
      return NextResponse.json(
        { error: "Could not cancel order (state may have changed)" },
        { status: 409 },
      );
    }

    // Reverse side effects (atomic + idempotent inside the helpers)
    await Promise.allSettled([
      reinstateOrderStock(String(cancelled._id)),
      reverseCouponUsage(String(cancelled._id)),
    ]);

    // Fire-and-forget customer notification
    (async () => {
      try {
        await sendStatusUpdateEmail(cancelled);
      } catch (err) {
        console.error("Failed to send cancellation email:", err);
      }
    })();

    invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG);
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/admin/orders");

    return NextResponse.json({
      success: true,
      message: "Order cancelled. Stock and coupon usage reversed.",
      order: cancelled,
      refundRequired: cancelled.isPaid,
    });
  } catch (error: any) {
    console.error("Order Cancellation Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
