import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WishlistClient from "./WishlistClient";

export const metadata = {
  title: "My Wishlist | Sai Nandhini",
  description: "Your saved favorite products from Sai Nandhini.",
};

export default function WishlistPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen pt-40 text-center">Loading wishlist...</div>}>
        <WishlistClient />
      </Suspense>
      <Footer />
    </>
  );
}