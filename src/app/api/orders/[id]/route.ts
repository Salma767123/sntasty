import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const order = await Order.findById(id).populate({
      path: "orderItems.product",
      select: "slug name",
    });

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Check if user owns the order or is an admin
    if (
      order.user.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - cancel an unpaid order (used when Razorpay payment is dismissed/failed)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only the order owner or admin can delete
    if (
      order.user.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Only allow deleting unpaid orders to prevent removing completed orders
    if (order.isPaid) {
      return NextResponse.json(
        { error: "Cannot delete a paid order" },
        { status: 400 },
      );
    }

    // Revert coupon usage if a coupon was applied
    if (order.couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
        if (coupon) {
          coupon.usedCount = Math.max(0, (coupon.usedCount || 1) - 1);
          const userUsageIndex = coupon.usedByUsers?.findIndex(
            (u: any) => u.userId.toString() === order.user.toString()
          );
          if (userUsageIndex !== undefined && userUsageIndex >= 0) {
            coupon.usedByUsers[userUsageIndex].count = Math.max(0, coupon.usedByUsers[userUsageIndex].count - 1);
            if (coupon.usedByUsers[userUsageIndex].count === 0) {
              coupon.usedByUsers.splice(userUsageIndex, 1);
            }
          }
          await coupon.save();
        }
      } catch (couponError) {
        console.error("Failed to revert coupon usage:", couponError);
      }
    }

    await Order.findByIdAndDelete(id);

    return NextResponse.json({ message: "Unpaid order cancelled" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
