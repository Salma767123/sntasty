import { getCouponsData } from "@/lib/admin-data";
import CouponsClient from "./CouponsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminCouponsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const coupons = await getCouponsData();

  return <CouponsClient initialData={coupons} />;
}
