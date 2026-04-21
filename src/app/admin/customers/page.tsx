import { getCustomersWithStats } from "@/lib/admin-data";
import CustomersClient from "./CustomersClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminCustomersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const customers = await getCustomersWithStats();

  return <CustomersClient initialData={customers} />;
}
