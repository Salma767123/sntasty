"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pagination, { usePagination } from "@/components/Pagination";
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  Search,
  Calendar,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function OrdersListClient({
  initialOrders,
}: {
  initialOrders: any[];
}) {
  const { data: session, isPending: status } = authClient.useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState<any[]>(initialOrders);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!status && !session) {
      router.push("/login?callbackUrl=/orders");
    }
  }, [session, status, router]);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.awbNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderItems.some((item: any) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => {
        const orderStatus =
          order.status || (order.isDelivered ? "Delivered" : "Pending");
        return orderStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedOrders,
    setCurrentPage,
    totalItems,
    itemsPerPage,
  } = usePagination(filteredOrders, 10);

  const getStatusConfig = (order: any) => {
    const status =
      order.status || (order.isDelivered ? "Delivered" : "Pending");

    const configs: Record<string, any> = {
      Delivered: {
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      Shipping: {
        icon: Truck,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      Processing: {
        icon: Package,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
      },
      Pending: {
        icon: Clock,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200",
      },
    };

    return configs[status] || configs.Pending;
  };

  const orderStats = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === "Delivered" || o.isDelivered)
      .length,
    processing: orders.filter((o) => o.status === "Processing").length,
    shipping: orders.filter((o) => o.status === "Shipping").length,
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-secondary/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading Orders...
          </p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-secondary/30 flex flex-col">
      <div className="flex-grow pt-44 md:pt-44 pb-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-8">
            <div>
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-2 md:mb-3 block">
                Order History
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary-dark">
                Your <span className="text-primary italic">Orders</span>
              </h1>
              <p className="text-gray-500 mt-1 md:mt-2 text-sm font-medium">
                Track and manage all your purchases
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {orders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Total Orders",
                  value: orderStats.total,
                  color: "primary",
                },
                {
                  label: "Delivered",
                  value: orderStats.delivered,
                  color: "green",
                },
                {
                  label: "Processing",
                  value: orderStats.processing,
                  color: "orange",
                },
                {
                  label: "Shipping",
                  value: orderStats.shipping,
                  color: "blue",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm"
                >
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-2">
                    {stat.label}
                  </p>
                  <p
                    className={`text-2xl md:text-3xl font-bold text-${stat.color === "primary" ? "primary-dark" : stat.color + "-600"}`}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Search and Filter Bar */}
          {orders.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by order ID, AWB, or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-primary transition-colors text-sm font-medium"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "Delivered", "Shipping", "Processing", "Pending"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 md:px-6 py-3 md:py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                        statusFilter === status
                          ? "bg-primary text-white shadow-lg"
                          : "bg-white text-gray-400 border border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      {status === "all" ? "All" : status}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-16 md:p-20 rounded-[3rem] text-center shadow-sm border border-gray-100"
          >
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark mb-3">
              {searchQuery || statusFilter !== "all"
                ? "No orders found"
                : "No orders yet"}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Your cart is waiting to be filled with authentic South Indian flavors"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                href="/shop"
                className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-dark transition-all inline-flex items-center gap-3"
              >
                Start Shopping <ArrowRight size={20} />
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {paginatedOrders.map((order, i) => {
                const statusConfig = getStatusConfig(order);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Section - Order Info */}
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                              <Package size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Order ID
                              </p>
                              <p className="text-xl font-serif font-bold text-primary-dark">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Calendar size={12} />
                                {mounted
                                  ? new Date(
                                      order.createdAt,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "..."}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}
                          >
                            <StatusIcon
                              size={16}
                              className={statusConfig.color}
                            />
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${statusConfig.color}`}
                            >
                              {order.status ||
                                (order.isDelivered ? "Delivered" : "Pending")}
                            </span>
                          </div>
                        </div>

                        {/* AWB Number */}
                        {order.awbNumber && (
                          <div className="mb-4 inline-block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              Tracking Number
                            </p>
                            <p className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-mono border border-blue-100">
                              {order.awbNumber}
                            </p>
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {order.orderItems
                            .slice(0, 4)
                            .map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex-shrink-0 group relative"
                              >
                                <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-2 relative group/item">
                                  <Image
                                    src={item.image}
                                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform"
                                    alt={item.name}
                                    fill
                                    sizes="80px"
                                  />
                                  <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    x{item.qty}
                                  </div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-600 line-clamp-2 w-20 leading-tight">
                                  {item.name}
                                </p>

                              </div>
                            ))}
                          {order.orderItems.length > 4 && (
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                              <p className="text-xs font-bold text-gray-400">
                                +{order.orderItems.length - 4}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Price & Actions */}
                      <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-end lg:w-56 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                        <div className="text-left lg:text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Total Amount
                          </p>
                          <p className="text-3xl font-bold text-primary-dark mb-2">
                            ₹{order.totalPrice.toLocaleString()}
                          </p>
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.isPaid
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : "bg-orange-50 text-orange-600 border border-orange-200"
                            }`}
                          >
                            {order.isPaid ? (
                              <>
                                <CheckCircle2 size={12} />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock size={12} />
                                Pending
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex lg:flex-col gap-2 lg:mt-auto lg:w-full">
                          <Link
                            href={`/orders/${order._id}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all shadow-sm"
                          >
                            <Eye size={14} />
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>
    </main>
  );
}
