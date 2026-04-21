import { getAnalyticsData } from "@/lib/admin-data";
import AnalyticsClient from "./AnalyticsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminAnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const data = await getAnalyticsData();

  return <AnalyticsClient initialData={JSON.parse(JSON.stringify(data))} />;
}
