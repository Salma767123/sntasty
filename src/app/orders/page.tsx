import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrdersListClient from "./OrdersListClient";

export const metadata = {
  title: "My Orders | Sai Nandhini",
  description: "View and track your orders from Sai Nandhini.",
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/orders");
  }

  await connectDB();
  const orders = await Order.find({ user: session.user.id })
    .select("_id createdAt status isDelivered awbNumber orderItems totalPrice isPaid")
    .populate({
      path: "orderItems.product",
      select: "slug name",
    })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <OrdersListClient initialOrders={JSON.parse(JSON.stringify(orders))} />
      </div>
      <Footer />
    </div>
  );
}
