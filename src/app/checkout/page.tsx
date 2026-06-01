import {
  getSettingsData,
  getShippingRatesData,
  getCouponsData,
  getUomWeightsData,
} from "@/lib/admin-data";
import CheckoutClient from "./CheckoutClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout | Sai Nandhini",
  description: "Secure checkout for your authentic homemade sweets.",
};

export default async function CheckoutPage() {
  const [settings, shippingRates, coupons, uomWeights] = await Promise.all([
    getSettingsData(),
    getShippingRatesData(),
    getCouponsData(),
    getUomWeightsData(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <CheckoutClient
          initialSettings={settings}
          initialShippingRates={shippingRates}
          initialCoupons={coupons}
          initialUomWeights={uomWeights}
        />
      </div>
      <Footer />
    </div>
  );
}
