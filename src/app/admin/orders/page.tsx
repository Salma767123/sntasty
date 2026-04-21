import { getOrdersData } from "@/lib/admin-data";
import OrdersClient from "./OrdersClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function AdminOrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const orders = await getOrdersData();

  return (
    <Suspense
      fallback={
        <div className="p-8 font-serif font-black text-[#234d1b] uppercase tracking-widest">
          Loading Intelligence...
        </div>
      }
    >
      <OrdersClient initialOrders={orders} />
    </Suspense>
  );
}
