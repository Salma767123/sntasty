import { getCategoriesData } from "@/lib/admin-data";
import CategoriesClient from "./CategoriesClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const categories = await getCategoriesData();

  return <CategoriesClient initialData={categories} />;
}
