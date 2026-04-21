"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Truck,
  Printer,
  Receipt,
} from "lucide-react";
import Link from "next/link";

export default function OrderDetailsClient({
  id,
  order,
}: {
  id: string;
  order: any;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-bold">Order not found.</p>
      </div>
    );

  // Helper for status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-600";
      case "Shipping":
        return "bg-blue-100 text-blue-600";
      case "Processing":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle2 size={16} />;
      case "Shipping":
        return <Truck size={16} />;
      case "Processing":
        return <Package size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const currentStatus =
    order.status || (order.isDelivered ? "Delivered" : "Pending");

  return (
    <main className="min-h-screen bg-gray-50 pb-20 overflow-hidden">
      <div className="pt-44 md:pt-44 max-w-5xl mx-auto px-4 sm:px-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:text-primary transition-colors mb-6 md:mb-8"
        >
          <ChevronLeft size={14} className="md:w-4 md:h-4" /> Back to My Orders
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-primary-dark">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium italic">
              Placed on{" "}
              {mounted ? new Date(order.createdAt).toLocaleDateString() : "..."}{" "}
              at{" "}
              {mounted ? new Date(order.createdAt).toLocaleTimeString() : "..."}
            </p>
          </div>
          <div
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 shadow-sm ${getStatusStyle(currentStatus)}`}
          >
            {getStatusIcon(currentStatus)}
            {currentStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm">
              <h3 className="text-lg md:text-xl font-serif font-bold text-primary-dark mb-6 md:mb-8 flex items-center gap-3">
                <Package className="text-primary" size={20} /> Purchased
                Delicacies
              </h3>
              <div className="space-y-6">
                {order.orderItems.map((item: any, i: number) => (
                  <div key={i} className="flex gap-6 items-center">
                    <div className="w-20 h-20 rounded-2xl bg-secondary/20 overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={
                          item.image ||
                          "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=100"
                        }
                        className="w-full h-full object-cover"
                        alt={item.name}
                        fill
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-primary-dark">
                        {item.name}
                      </h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-400 font-medium">
                          Qty: {item.qty}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">₹{item.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm">
              <h3 className="text-lg md:text-xl font-serif font-bold text-primary-dark mb-6 md:mb-8 flex items-center gap-3">
                <MapPin className="text-primary" size={20} /> Delivery
                Destination
              </h3>
              <div className="text-gray-500 space-y-2 font-medium">
                <p className="text-primary-dark font-bold text-lg">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.email}</p>
                <p>{order.shippingAddress.phone}</p>
                <p className="pt-2 border-t border-gray-50 mt-2">
                  {order.shippingAddress.address}, {order.shippingAddress.city}{" "}
                  - {order.shippingAddress.pincode}
                </p>
              </div>

              {/* AWB Section */}
              {order.awbNumber && (
                <div className="mt-8 pt-8 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">
                    Shipment Tracking
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 bg-blue-50 p-5 rounded-2xl border border-blue-100 text-blue-800">
                      <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                        <Truck size={20} className="text-blue-500" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-1 tracking-wider">
                          {order.courierName ? order.courierName : "AWB Number"}
                        </p>
                        <span className="font-mono font-bold text-xl tracking-tight">
                          {order.awbNumber}
                        </span>
                      </div>
                      {order.trackingLink && (
                        <a 
                          href={order.trackingLink.replace('{trackingNumber}', order.awbNumber)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="shrink-0 bg-white border border-blue-100 px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors hover:bg-blue-600 hover:text-white shadow-sm"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                    
                    {order.estimatedDeliveryDate && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <p className="font-medium text-gray-500">
                           Estimated Delivery Date: <span className="font-bold text-primary-dark">{mounted ? new Date(order.estimatedDeliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</span>
                        </p>
                      </div>
                    )}
                    
                    {order.shippingNotes && (
                      <div className="bg-[#fffdfa] p-5 rounded-xl text-sm text-gray-600 border border-[#f5e6d3]">
                        <span className="font-bold uppercase text-[10px] tracking-widest block mb-2 text-[#b08b5e]">Important Note</span>
                        <p className="leading-relaxed">{order.shippingNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 md:space-y-8 h-fit">
            <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-primary/5">
              <h3 className="text-lg md:text-xl font-serif font-bold text-primary-dark mb-6 md:mb-8">
                Financial Summary
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    ₹{order.itemsPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-500 font-bold uppercase text-[10px] tracking-widest pt-1">
                    {order.shippingPrice ? `₹${order.shippingPrice}` : "FREE"}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-bold">
                      -₹{order.discount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                  <span className="text-xl font-serif font-bold text-primary-dark">
                    Total
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    ₹{order.totalPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-gray-400" size={18} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                      Payment Method
                    </p>
                    <p className="font-bold text-primary-dark text-sm mt-1 uppercase">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${order.isPaid ? "bg-green-500" : "bg-orange-400"}`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {order.isPaid
                      ? `Verified & Paid on ${mounted ? new Date(order.paidAt).toLocaleDateString() : "..."}`
                      : "Payment Verification Pending"}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4">
                <Link
                  href={`/orders/${id}/invoice?format=a4`}
                  target="_blank"
                  className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-600"
                >
                  <Printer size={16} /> A4 Invoice
                </Link>
                <Link
                  href={`/orders/${id}/invoice?format=thermal`}
                  target="_blank"
                  className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-600"
                >
                  <Receipt size={16} /> Thermal
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
