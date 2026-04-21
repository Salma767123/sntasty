import { getProducts, getCategories, getSettings } from "@/lib/data";
import ShopClient from "./ShopClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Shop Premium Sweets & Snacks | Sai Nandhini",
  description:
    "Browse our collection of authentic homemade sweets, snacks, and treats. Direct from our kitchen to your doorstep.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, categories, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getSettings(),
  ]);

  return (
    <main className="min-h-screen bg-secondary/30">
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-[10px] font-sans font-black text-primary-dark uppercase tracking-widest">
                Waking up the kitchen...
              </p>
            </div>
          </div>
        }
      >
        <ShopClient
          initialProducts={products}
          initialCategories={categories}
          initialManageInventory={settings.manageInventory ?? true}
        />
      </Suspense>
      <Footer />
    </main>
  );
}
