"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    Package,
    MapPin,
    CreditCard,
    CheckCircle2,
    Clock,
    Truck,
    Search,
    Loader2,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Download,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { validateForm, orderTrackSchema, FieldErrors } from "@/lib/validations";
import FormError from "@/components/FormError";

export default function TrackOrderClient() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        setMounted(true);
        if (orderId && email) {
            handleTrack(undefined, orderId, email);
        }
    }, []);

    const handleTrack = async (e?: React.FormEvent, idToUse = orderId, emailToUse = email) => {
        if (e) e.preventDefault();

        const validation = validateForm(orderTrackSchema, { orderId: idToUse, email: emailToUse });
        if (!validation.success) {
            setFieldErrors(validation.errors);
            return;
        }
        setFieldErrors({});

        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch("/api/orders/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: idToUse.trim(), email: emailToUse.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Order not found or unauthorized access.");
            }

            setOrder(data);
        } catch (err: any) {
            toast.error(err.message);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Delivered": return "bg-green-100 text-green-600 border-green-200";
            case "Shipping": return "bg-blue-100 text-blue-600 border-blue-200";
            case "Processing": return "bg-orange-100 text-orange-600 border-orange-200";
            default: return "bg-gray-100 text-gray-500 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Delivered": return <CheckCircle2 size={18} />;
            case "Shipping": return <Truck size={18} />;
            case "Processing": return <Package size={18} />;
            default: return <Clock size={18} />;
        }
    };

    const currentStatus = order?.status || (order?.isDelivered ? "Delivered" : "Pending");

    return (
        <main className="min-h-screen bg-gray-50/50 pb-20">
            <div className="pt-40 max-w-5xl mx-auto px-4 sm:px-6">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                    >
                        <Search size={14} /> Real-time Tracking
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark mb-4">Track Your Order</h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Enter your details below to see the current status of your delicious snacks.
                    </p>
                </div>

                {/* Search Form */}
                <motion.div
                    layout
                    className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-primary/5 border border-gray-100 mb-12 max-w-3xl mx-auto"
                >
                    <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Order ID</label>
                            <input
                                type="text"
                                placeholder="e.g. 65af..."
                                value={orderId}
                                onChange={(e) => { setOrderId(e.target.value); setFieldErrors(prev => ({ ...prev, orderId: "" })); }}
                                className={`w-full bg-gray-50 border-2 ${fieldErrors.orderId ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium`}
                            />
                            <FormError message={fieldErrors.orderId} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: "" })); }}
                                className={`w-full bg-gray-50 border-2 ${fieldErrors.email ? "border-red-300" : "border-transparent"} focus:border-primary/20 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium`}
                            />
                            <FormError message={fieldErrors.email} />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Track"}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Results Area */}
                <AnimatePresence mode="wait">
                    {!order && hasSearched && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
                        >
                            <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-primary-dark">No Order Found</h3>
                            <p className="text-gray-400 mt-2">Please double check your Order ID and Email address.</p>
                        </motion.div>
                    )}

                    {order && (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-serif font-bold text-primary-dark">Order #{order._id.slice(-8).toUpperCase()}</h2>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(currentStatus)} flex items-center gap-2`}>
                                            {getStatusIcon(currentStatus)}
                                            {currentStatus}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs font-medium">
                                        Order Date: {mounted ? new Date(order.createdAt).toLocaleDateString() : '...'} at {mounted ? new Date(order.createdAt).toLocaleTimeString() : '...'}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/orders/${order._id}/invoice?email=${encodeURIComponent(email)}`);
                                                
                                                if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `invoice-${order._id.slice(-8).toUpperCase()}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } else {
                                                    // If PDF generation failed, open the invoice page in new tab
                                                    window.open(`/orders/${order._id}/invoice?format=a4&email=${encodeURIComponent(email)}`, '_blank');
                                                }
                                            } catch (error) {
                                                console.error('Download failed:', error);
                                                // Fallback to opening invoice page
                                                window.open(`/orders/${order._id}/invoice?format=a4&email=${encodeURIComponent(email)}`, '_blank');
                                            }
                                        }}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/20 cursor-pointer"
                                        title="Download Invoice"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <a
                                        href={`/orders/${order._id}/invoice?format=a4&email=${encodeURIComponent(email)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
                                        title="View Invoice"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Order Items */}
                                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-serif font-bold text-primary-dark mb-8 flex items-center gap-3">
                                            <Package className="text-primary" size={20} /> Your Order Items
                                        </h3>
                                        <div className="divide-y divide-gray-50">
                                            {order.orderItems.map((item: any, i: number) => (
                                                <div key={i} className="py-6 first:pt-0 last:pb-0 flex gap-6 items-center">
                                                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                                                        <Image
                                                            src={item.image || "https://placehold.co/400x400/f5f0e8/234d1b?text=" + item.name}
                                                            className="w-full h-full object-cover"
                                                            alt={item.name}
                                                            fill
                                                            sizes="80px"
                                                        />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-primary-dark">{item.name}</h4>
                                                            <span className="font-bold text-primary">₹{item.price * item.qty}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-1 font-medium italic">
                                                            {item.uom ? `${item.uom} • ` : ""}Qty: {item.qty}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shipping & Payment Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-serif font-bold text-primary-dark mb-6 flex items-center gap-3">
                                                <MapPin className="text-primary" size={18} /> Delivery Address
                                            </h3>
                                            <div className="text-gray-500 text-sm space-y-2 font-medium">
                                                <p className="text-primary-dark font-bold text-base">{order.shippingAddress.fullName}</p>
                                                <p>{order.shippingAddress.address}</p>
                                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                                <p className="pt-2 flex items-center gap-2"><ArrowRight size={14} className="text-primary" /> {order.shippingAddress.phone}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-serif font-bold text-primary-dark mb-6 flex items-center gap-3">
                                                    <CreditCard className="text-primary" size={18} /> Payment Info
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                                                        <div className={`w-2 h-2 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-orange-400'}`} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                            {order.isPaid ? "Payment Verified" : "Payment Pending"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 font-medium px-1">Method: <span className="text-primary-dark font-bold uppercase">{order.paymentMethod}</span></p>
                                                </div>
                                            </div>

                                            {order.awbNumber && (
                                                <div className="mt-8 pt-6 border-t border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-4">AWB Tracking</p>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-center gap-4 bg-[#f4f8ff] px-6 py-4 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-500/5">
                                                            <Truck size={22} className="text-blue-500 shrink-0" />
                                                            <div className="flex-grow flex flex-col justify-center">
                                                              <p className="text-xl font-bold text-blue-800 tracking-tight leading-none mb-1.5">{order.awbNumber}</p>
                                                              {order.courierName && <p className="text-[10px] uppercase font-black text-blue-500 tracking-widest leading-none">{order.courierName}</p>}
                                                            </div>
                                                            {order.trackingLink && (
                                                                <a 
                                                                  href={order.trackingLink.replace('{trackingNumber}', order.awbNumber)} 
                                                                  target="_blank" 
                                                                  rel="noopener noreferrer"
                                                                  className="shrink-0 bg-white border border-gray-100 px-6 py-3 rounded-xl text-[10px] font-black text-blue-800 uppercase tracking-widest transition-all hover:border-blue-200 hover:shadow-sm"
                                                                >
                                                                    Track
                                                                </a>
                                                            )}
                                                        </div>
                                                        {order.estimatedDeliveryDate && (
                                                            <p className="text-[15px] text-gray-500 font-medium px-1">
                                                                Expected Delivery: <span className="font-bold text-gray-900">{mounted ? new Date(order.estimatedDeliveryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' }) : '...'}</span>
                                                            </p>
                                                        )}
                                                        {order.shippingNotes && (
                                                            <div className="bg-[#fffdfa] p-4 rounded-xl text-xs text-gray-600 border border-[#f5e6d3] mt-2">
                                                                <span className="font-bold uppercase text-[10px] tracking-widest block mb-1 text-[#b08b5e]">Tracking Note</span>
                                                                {order.shippingNotes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <aside className="space-y-8">
                                    <div className="bg-primary-dark text-white p-8 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Receipt size={80} />
                                        </div>
                                        <h3 className="text-xl font-serif font-bold mb-8 relative z-10">Order Total</h3>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between text-sm text-white/60">
                                                <span>Subtotal</span>
                                                <span>₹{order.itemsPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-white/60">
                                                <span>Delivery</span>
                                                <span>{order.shippingPrice ? `₹${order.shippingPrice.toFixed(2)}` : 'FREE'}</span>
                                            </div>
                                            {order.discount > 0 && (
                                                <div className="flex justify-between text-sm text-accent">
                                                    <span>Discount</span>
                                                    <span>-₹{order.discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                                <span className="text-lg font-bold">Total Pay</span>
                                                <span className="text-3xl font-bold text-accent">₹{order.totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-primary-dark mb-4 flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-green-500" /> Safe & Secure
                                        </h4>
                                        <p className="text-sm text-gray-500 leading-relaxed italic">
                                            "At Sai Nandhini, we ensure every treat is packed with care and delivered fresh to your doorstep. Thank you for choosing us!"
                                        </p>
                                    </div>
                                </aside>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
