import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

/**
 * GET /api/coupons/active
 * Fetch all active coupons that are valid for display in checkout
 */
export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    const activeCoupons = await Coupon.find({
      isActive: true,
      displayInCheckout: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    })
      .select(
        "code discountType discountValue description minOrderValue maxDiscountAmount",
      )
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: activeCoupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
