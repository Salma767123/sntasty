import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCouponsData } from "@/lib/admin-data";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const coupons = await getCouponsData();
    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    // Check if body is an array for bulk creation
    if (Array.isArray(body)) {
      const createdCoupons = [];
      const errors = [];
      const existingCodes = new Set(
        (await Coupon.find().distinct("code")) as string[]
      );

      for (const couponData of body) {
        try {
          // Check duplicate code
          if (existingCodes.has(couponData.code.toUpperCase())) {
            errors.push(`Coupon code ${couponData.code} already exists`);
            continue;
          }

          const coupon = await Coupon.create({
            ...couponData,
            code: couponData.code.toUpperCase(),
            createdBy: (session.user as any).id,
          });
          createdCoupons.push(coupon);
          existingCodes.add(coupon.code);
        } catch (err: any) {
          errors.push(`Failed to create ${couponData.code}: ${err.message}`);
        }
      }

      return NextResponse.json(
        {
          success: true,
          count: createdCoupons.length,
          data: createdCoupons,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 201 },
      );
    }

    // Single coupon creation logic
    const existing = await Coupon.findOne({ code: body.code.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 },
      );
    }

    const coupon = await Coupon.create({
      ...body,
      code: body.code.toUpperCase(),
      createdBy: (session.user as any).id,
    });
    
    // Revalidate checkout page to show new coupon immediately
    revalidatePath("/checkout");
    
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
