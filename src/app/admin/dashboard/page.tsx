import { getDashboardStats } from "@/lib/admin-data";
import DashboardClient from "./DashboardClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const data = await getDashboardStats("week");

  return <DashboardClient initialData={data} />;
}
