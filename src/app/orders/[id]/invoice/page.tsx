import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import InvoiceClient from "./InvoiceClient";

export const metadata = {
  title: "Invoice | Sai Nandhini",
};

export default async function InvoicePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const format =
    typeof searchParams.format === "string" ? searchParams.format : "a4";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await connectDB();
  const order = await Order.findById(id).populate({
    path: "orderItems.product",
    select: "slug name",
  }).lean();

  if (!order) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Order not found
      </div>
    );
  }

  // Authorization check:
  // 1. If user is admin, allow access
  // 2. If order has a user and session exists, check if they match
  // 3. If order is a guest order (no user), allow access (invoice link sent via email)
  // 4. If a valid email query param matches the shipping address (track page flow), allow access
  const isAdmin = session && (session.user as any).role === "admin";
  const isOrderOwner = order.user && session && order.user.toString() === session.user.id;
  const isGuestOrder = !order.user;
  const emailParam = typeof searchParams.email === "string" ? searchParams.email.trim().toLowerCase() : null;
  const isEmailVerified =
    emailParam &&
    order.shippingAddress &&
    (order.shippingAddress as any).email?.trim().toLowerCase() === emailParam;

  if (!isAdmin && !isOrderOwner && !isGuestOrder && !isEmailVerified) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Unauthorized access
      </div>
    );
  }

  return (
    <InvoiceClient order={JSON.parse(JSON.stringify(order))} format={format} />
  );
}
