import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req: Request) {
    try {
        const { orderId, email } = await req.json();

        if (!orderId || !email) {
            return NextResponse.json(
                { error: "Order ID and email are required" },
                { status: 400 }
            );
        }

        await connectDB();

        let order;
        
        // Remove # if present and convert to uppercase
        const cleanOrderId = orderId.replace(/^#/, '').toUpperCase();

        // Check if it's a full MongoDB ID (24 characters) or short ID (6-8 characters)
        if (/^[0-9a-fA-F]{24}$/.test(cleanOrderId)) {
            // Full MongoDB ID
            order = await Order.findById(cleanOrderId).populate({
                path: "orderItems.product",
                select: "slug name",
            });
        } else if (cleanOrderId.length >= 6 && cleanOrderId.length <= 8) {
            // Short ID - search by last 6-8 characters of _id
            const allOrders = await Order.find({}).populate({
                path: "orderItems.product",
                select: "slug name",
            });
            
            // Find order where the last characters match
            order = allOrders.find(o => 
                o._id.toString().slice(-cleanOrderId.length).toUpperCase() === cleanOrderId
            );
        } else {
            return NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 });
        }

        if (!order) {
            console.log(`Order not found for ID: ${cleanOrderId}`);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verify email matches the order
        if (order.shippingAddress.email.toLowerCase() !== email.toLowerCase()) {
            console.log(`Email mismatch for order ${cleanOrderId}: provided ${email}, expected ${order.shippingAddress.email}`);
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // Serialize the order properly to avoid circular references
        const serializedOrder = JSON.parse(JSON.stringify(order));
        console.log(`Order found and serialized successfully for ID: ${cleanOrderId}`);

        return NextResponse.json(serializedOrder);
    } catch (error: any) {
        console.error("Track order error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
