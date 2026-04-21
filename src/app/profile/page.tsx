import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile | Sai Nandhini",
  description: "Manage your account and profile settings.",
};

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <ProfileClient />
      </div>
      <Footer />
    </div>
  );
}
