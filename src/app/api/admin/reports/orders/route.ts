import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch all orders
    // Fetch all orders
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("items.product", "name");

    // Generate CSV
    const header = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Status",
      "Total Amount",
      "Items",
    ];
    const rows = orders.map((order: any) => [
      order._id,
      new Date(order.createdAt).toISOString(),
      order.user?.name || "Guest",
      order.user?.email || "N/A",
      order.status,
      order.totalAmount,
      order.items.map((i: any) => `${i.product?.name} (x${i.qty})`).join("; "),
    ]);

    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders_report_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
