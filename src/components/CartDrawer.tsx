"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Truck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, updateQty, cartTotal, cartCount } =
    useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full relative z-10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center mt-20 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
                  <ShoppingBag className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">
                    Shopping Cart
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl hover:bg-white/80 flex items-center justify-center text-gray-400 hover:text-primary-dark transition-all border border-transparent hover:border-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-300 shadow-inner">
                    <ShoppingBag size={48} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-900 font-bold text-lg">
                      Your cart is empty
                    </p>
                    <p className="text-gray-500 text-sm">
                      Add items to get started
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div
                    key={`${item._id}-${item.uom}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
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
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-grow">
                          <h4 className="font-semibold text-primary-dark text-sm leading-tight line-clamp-2 mb-1">
                            {item.name}
                          </h4>
                          {item.uom && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                              {item.uom}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id, item.uom)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                          <button
                            onClick={() =>
                              updateQty(item._id, item.qty - 1, item.uom)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-gray-600 hover:text-primary-dark transition-all border border-transparent hover:border-gray-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-8 text-center text-primary-dark">
                            {item.qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQty(item._id, item.qty + 1, item.uom)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-gray-600 hover:text-primary-dark transition-all border border-transparent hover:border-gray-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-bold text-primary-dark text-base">
                          ₹{(item.price * item.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      Subtotal
                    </span>
                    <span className="font-bold text-primary-dark">
                      ₹{cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Truck size={16} className="text-gray-400" />
                      Shipping
                    </span>
                    <span className="text-xs text-accent font-semibold">
                      At Checkout
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      Taxes
                    </span>
                    <span className="text-xs text-accent font-semibold">
                      At Checkout
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-primary-dark">
                        ₹{cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] group hover:from-primary-dark hover:to-primary"
                >
                  Proceed to Checkout
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
