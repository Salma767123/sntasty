import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderDetailsClient from "./OrderDetailsClient";

export const metadata = {
  title: "Order Details | Sai Nandhini",
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/orders/" + id);
  }

  await connectDB();
  const order = await Order.findById(id).populate({
    path: "orderItems.product",
    select: "slug name",
  }).lean();

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="font-bold text-gray-500">Order not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (
    order.user.toString() !== session.user.id &&
    (session.user as any).role !== "admin"
  ) {
    redirect("/orders");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <OrderDetailsClient id={id} order={JSON.parse(JSON.stringify(order))} />
      </div>
      <Footer />
    </div>
  );
}
