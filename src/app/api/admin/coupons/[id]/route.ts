import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const coupon = await Coupon.findByIdAndUpdate(id, body, { 
      returnDocument: "after" 
    });
    if (!coupon)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    // Revalidate checkout page to show updated coupon immediately
    revalidatePath("/checkout");

    return NextResponse.json(coupon);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    // Revalidate checkout page to remove deleted coupon immediately
    revalidatePath("/checkout");

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
