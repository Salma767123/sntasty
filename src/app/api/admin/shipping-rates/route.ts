import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ShippingRate from "@/models/ShippingRate";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await connectDB();
    const rates = await ShippingRate.find().sort({ location: 1 });
    return NextResponse.json(rates);
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

    // Check if location already exists
    const existingRate = await ShippingRate.findOne({ location: body.location });
    if (existingRate) {
      return NextResponse.json(
        { error: "Shipping rate for this location already exists" },
        { status: 400 },
      );
    }

    const rate = await ShippingRate.create(body);
    
    // Revalidate checkout page to show new shipping rate immediately
    revalidatePath("/checkout");
    
    return NextResponse.json(rate, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const rate = await ShippingRate.findByIdAndUpdate(
      body._id,
      {
        rate: body.rate,
        estimatedDelivery: body.estimatedDelivery,
      },
      { new: true }
    );

    if (!rate) {
      return NextResponse.json({ error: "Shipping rate not found" }, { status: 404 });
    }

    // Revalidate checkout page to show updated shipping rate immediately
    revalidatePath("/checkout");

    return NextResponse.json(rate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
