import { getProductsData, getSettingsData, getCategoriesData } from "@/lib/admin-data";
import ProductsClient from "./ProductsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminProductsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/login");
  }

  const [products, settings, categories] = await Promise.all([
    getProductsData(),
    getSettingsData(),
    getCategoriesData(),
  ]);

  return (
    <ProductsClient initialProducts={products} initialSettings={settings} initialCategories={categories} />
  );
}
