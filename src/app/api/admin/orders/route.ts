import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = status && status !== "All" ? { status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json(orders);
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
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds) || !status) {
      return NextResponse.json(
        { error: "Missing orderIds or status" },
        { status: 400 },
      );
    }

    await connectDB();

    const updateData: any = { status };
    if (status === "Delivered") {
      updateData.isDelivered = true;
      updateData.deliveredAt = Date.now();
    }

    await Order.updateMany({ _id: { $in: orderIds } }, { $set: updateData });

    revalidatePath("/orders");
    return NextResponse.json({ message: "Orders updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
