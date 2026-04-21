import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackOrderClient from "./TrackOrderClient";

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen pt-40 text-center">Loading tracker...</div>}>
        <TrackOrderClient />
      </Suspense>
      <Footer />
    </>
  );
}
