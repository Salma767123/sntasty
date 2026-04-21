import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

/**
 * GET /api/coupons/active
 * Get all active coupons for display in checkout
 */
export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      displayInCheckout: true,
      $or: [
        { expiresAt: { $exists: false } }, // No expiry date
        { expiresAt: { $gt: now } }, // Not yet expired
      ],
    })
      .select("code discountType discountValue description minOrderValue maxDiscountAmount")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
