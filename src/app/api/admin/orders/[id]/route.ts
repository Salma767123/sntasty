import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendStatusUpdateEmail } from "@/lib/email-service";
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

    await connectDB();
    const body = await req.json();

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // We only allow updating delivery or payment status manually for admin (though payment should usually be automated)
    const updateData: any = {};
    let statusChanged = false;

    const ORDER_STAGES = ["Pending", "Processing", "Shipping", "Delivered"];

    // Updatable fields
    if (body.status && body.status !== existingOrder.status) {
      // Enforce forward-only status progression
      const currentIdx = ORDER_STAGES.indexOf(existingOrder.status);
      const newIdx = ORDER_STAGES.indexOf(body.status);
      if (newIdx === -1) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      if (newIdx < currentIdx) {
        return NextResponse.json(
          { error: "Order status cannot be reverted to a previous stage" },
          { status: 400 },
        );
      }

      statusChanged = true;
      updateData.status = body.status;
      
      // Automatically sync isDelivered and deliveredAt based on status
      if (body.status === "Delivered") {
        updateData.isDelivered = true;
        updateData.deliveredAt = Date.now();
      } else {
        updateData.isDelivered = false;
        updateData.deliveredAt = null;
      }
    }

    if (body.awbNumber) updateData.awbNumber = body.awbNumber;
    if (body.courierName) updateData.courierName = body.courierName;
    if (body.trackingLink) updateData.trackingLink = body.trackingLink;
    if (body.estimatedDeliveryDate) updateData.estimatedDeliveryDate = body.estimatedDeliveryDate;
    if (body.shippingNotes !== undefined) updateData.shippingNotes = body.shippingNotes;

    // Only allow manual isDelivered/isPaid updates if status wasn't explicitly changed
    if (body.isDelivered !== undefined && !body.status) {
      updateData.isDelivered = body.isDelivered;
      updateData.deliveredAt = body.isDelivered ? Date.now() : null;
      if (body.isDelivered) {
        updateData.status = "Delivered";
        statusChanged = true;
      }
    }
    
    if (body.isPaid !== undefined) {
      updateData.isPaid = body.isPaid;
      updateData.paidAt = body.isPaid ? Date.now() : null;
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (statusChanged) {
      // Fire and forget email sending
      (async () => {
        try {
          await sendStatusUpdateEmail(order);
        } catch (err) {
          console.error("Failed to send status update email:", err);
        }
      })();
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
