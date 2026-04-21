import { getSettingsData } from "@/lib/admin-data";
import CmsClient from "./CmsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Disable caching for this page to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCmsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const settings = await getSettingsData();

  return <CmsClient initialSettings={settings} />;
}
