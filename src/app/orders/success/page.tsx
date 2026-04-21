"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authClient } from "@/lib/auth-client";

export default function SuccessPage() {
    const { data: session } = authClient.useSession();

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-48 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-10"
                >
                    <CheckCircle2 size={48} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary-dark mb-6">Order Confirmed!</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12">
                        Thank you for your order. We've received your payment and our chefs are already preparing your delicacies with love.
                        {!session && (
                            <span className="block mt-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                Since you checked out as a guest, please save your Order ID (available in your email) to track your order.
                            </span>
                        )}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        {session ? (
                            <Link href="/orders" className="bg-primary text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-xl active:scale-95">
                                <ShoppingBag size={20} /> View Order Status
                            </Link>
                        ) : (
                            <Link href="/login" className="bg-primary text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-xl active:scale-95">
                                <ShoppingBag size={20} /> Login to Track Order
                            </Link>
                        )}
                        <Link href="/shop" className="text-primary font-bold hover:underline flex items-center gap-1 group">
                            Continue Shopping <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                {/* Floating Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-accent/20 rounded-full animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-primary/10 rounded-full animate-bounce" />
                <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-secondary rounded-full animate-ping" />
            </div>

            <Footer />
        </main>
    );
}
