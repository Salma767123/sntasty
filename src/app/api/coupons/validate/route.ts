import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * POST /api/coupons/validate
 * Validate a coupon code and return discount details
 */
export async function POST(req: Request) {
  try {
    const { code, orderAmount } = await req.json();

    if (!code || orderAmount === undefined) {
      return NextResponse.json(
        { error: "Coupon code and order amount required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Get user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    // Find coupon by code
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 },
      );
    }

    // Check if coupon is expired
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 },
      );
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Coupon usage limit reached" },
        { status: 400 },
      );
    }

    // Check per-user limit
    if (userId && coupon.perUserLimit) {
      const userUsage = coupon.usedByUsers?.find(
        (u: any) => u.userId.toString() === userId
      );
      const userCount = userUsage?.count || 0;

      if (userCount >= coupon.perUserLimit) {
        return NextResponse.json(
          {
            error: `You have already used this coupon ${coupon.perUserLimit} time${coupon.perUserLimit > 1 ? "s" : ""}`,
          },
          { status: 400 },
        );
      }
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ₹${coupon.minOrderValue} required for this coupon`,
        },
        { status: 400 },
      );
    }

    // Calculate discount
    let discount = 0;
    let isFreeDelivery = false;

    if (coupon.discountType === "free-delivery") {
      isFreeDelivery = true;
      discount = 0; // The actual discount happens by waiving shipping
    } else if (coupon.discountType === "percentage") {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.discountType,
        value: coupon.discountValue,
        discount: discount,
        isFreeDelivery: isFreeDelivery,
        description: coupon.description,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
