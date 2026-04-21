"use client";

import { useEffect, useState } from "react";
import { useNavbarData } from "@/context/NavbarDataContext";

export default function InvoiceClient({
  order,
  format,
}: {
  order: any;
  format: string;
}) {
  const [mounted, setMounted] = useState(false);
  const { settings } = useNavbarData();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (order && settings) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [order, settings]);

  if (!order)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Order not found
      </div>
    );

  if (format === "thermal") {
    return (
      <div className="w-[80mm] mx-auto p-4 bg-white text-black font-mono text-xs leading-tight">
        <style jsx global>{`
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
        `}</style>
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase">
            {settings?.shopName || "Sai Nandhini Tasty World"}
          </h1>
          <p className="text-[10px]">
            {settings?.address ||
              "# 3/81, 1st Floor, Kaveri Main St, Thirunagar, Madurai - 625006"}
          </p>
          <p className="text-[10px]">
            WhatsApp: {settings?.contactPhone || "+91 96009 16065"}
          </p>
          <div className="border-b border-black border-dashed my-2" />
          <p className="font-bold">INVOICE</p>
          <p>#{order._id.slice(-6).toUpperCase()}</p>
          <p>{mounted ? new Date(order.createdAt).toLocaleString() : "..."}</p>
        </div>

        <div className="mb-4">
          <p className="font-bold">Customer:</p>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p className="text-[10px] mt-1">Delivery Address:</p>
          <p className="text-[10px]">{order.shippingAddress.address}</p>
          <p className="text-[10px]">
            {order.shippingAddress.city} - {order.shippingAddress.pincode}
          </p>
          {order.shippingAddress.state && (
            <p className="text-[10px]">{order.shippingAddress.state}</p>
          )}
        </div>

        <div className="border-b border-black border-dashed mb-2" />
        <div className="flex font-bold mb-1">
          <span className="flex-grow">Item</span>
          <span className="w-8 text-right">Qty</span>
          <span className="w-12 text-right">Amt</span>
        </div>
        <div className="border-b border-black border-dashed mb-2" />

        <div className="space-y-2 mb-4">
          {order.orderItems.map((item: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between">
                <span className="flex-grow">{item.name}</span>
                <span className="w-8 text-right">{item.qty}</span>
                <span className="w-12 text-right">
                  {(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-black border-dashed mb-2" />

        <div className="flex justify-between font-bold">
          <span>Subtotal:</span>
          <span>{order.itemsPrice.toFixed(2)}</span>
        </div>
        {order.taxPrice > 0 && (
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{order.shippingPrice.toFixed(2)}</span>
          </div>
        )}
        {order.discountPrice > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{order.discountPrice.toFixed(2)}</span>
          </div>
        )}

        <div className="border-b border-black border-dashed my-2" />

        <div className="flex justify-between text-base font-bold">
          <span>TOTAL:</span>
          <span>₹{order.totalPrice.toFixed(2)}</span>
        </div>

        <div className="text-center mt-6">
          <p className="font-bold">Thank You!</p>
          <p>Visit Again</p>
        </div>
      </div>
    );
  }

  // A4 Format
  return (
    <div className="max-w-[210mm] mx-auto p-12 bg-white text-gray-900 font-sans min-h-screen">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">
            {settings?.shopName?.split(" ").slice(0, 2).join(" ") ||
              "Sai Nandhini"}
          </h1>
          <h2 className="text-xl font-light tracking-widest uppercase mb-6">
            {settings?.shopName?.split(" ").slice(2).join(" ") || "Tasty World"}
          </h2>
          <p className="text-sm text-gray-500">
            {settings?.address?.split(",").slice(0, 2).join(",") ||
              "# 3/81, 1st Floor, Kaveri Main Street"}
          </p>
          <p className="text-sm text-gray-500">
            {settings?.address?.split(",").slice(2).join(",") ||
              "SRV Nagar, Thirunagar, Madurai - 625006"}
          </p>
          <p className="text-sm text-gray-500">
            Ph: {settings?.contactPhone || "+91 96009 16065"}
          </p>
          <p className="text-sm text-gray-500">
            Email: {settings?.contactEmail || "info@sainandhini.com"}
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-3xl font-bold text-gray-300 uppercase tracking-widest mb-4">
            Invoice
          </h3>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-bold text-gray-500 uppercase tracking-wider w-24 inline-block">
                Invoice #
              </span>{" "}
              <span className="font-mono font-bold">
                {order._id.slice(-8).toUpperCase()}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-bold text-gray-500 uppercase tracking-wider w-24 inline-block">
                Date
              </span>{" "}
              <span>
                {mounted
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "..."}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-bold text-gray-500 uppercase tracking-wider w-24 inline-block">
                Status
              </span>{" "}
              <span className="uppercase font-bold">
                {order.isPaid ? "Paid" : "Unpaid"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12 bg-gray-50 rounded-xl p-8 border border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Bill To
        </h4>
        <div className="text-lg font-bold text-gray-800 mb-1">
          {order.shippingAddress.fullName}
        </div>
        <div className="text-gray-600">{order.shippingAddress.address}</div>
        <div className="text-gray-600">
          {order.shippingAddress.city} - {order.shippingAddress.pincode}
        </div>
        <div className="text-gray-600 mt-2">
          Ph: {order.shippingAddress.phone}
        </div>
        <div className="text-gray-600">
          Email: {order.shippingAddress.email}
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-gray-100 text-left">
            <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Item Description
            </th>
            <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              Qty
            </th>
            <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
              Price
            </th>
            <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {order.orderItems.map((item: any, i: number) => (
            <tr key={i}>
              <td className="py-4">
                <div className="font-bold text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-400">HSN: 1905</div>
              </td>
              <td className="py-4 text-center font-bold text-gray-600">
                {item.qty}
              </td>
              <td className="py-4 text-right font-medium text-gray-600">
                ₹{item.price.toFixed(2)}
              </td>
              <td className="py-4 text-right font-bold text-gray-800">
                ₹{(item.price * item.qty).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-20">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Subtotal</span>
            <span>₹{order.itemsPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Shipping</span>
            <span>₹{order.shippingPrice.toFixed(2)}</span>
          </div>
          {order.discountPrice > 0 && (
            <div className="flex justify-between text-red-500 font-bold">
              <span>Discount</span>
              <span>-₹{order.discountPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-4 border-t-2 border-gray-100 text-primary-dark">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-bold">
              ₹{order.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-xs mt-auto pt-8 border-t border-gray-100">
        <p className="mb-2 font-bold uppercase tracking-widest">
          Thank you for your business!
        </p>
        <p>
          For any queries, please contact{" "}
          {settings?.contactEmail || "info@sainandhini.com"}
        </p>
        <p className="mt-4 text-[10px] text-gray-300">
          Computer generated invoice. No signature required.
        </p>
      </div>
    </div>
  );
}
