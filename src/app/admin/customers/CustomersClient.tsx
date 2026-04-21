"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ChevronRight,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Pagination, { usePagination } from "@/components/Pagination";

export default function CustomersClient({
  initialData,
}: {
  initialData: any[];
}) {
  const [customers, setCustomers] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedCustomers,
    setCurrentPage,
    totalItems,
    itemsPerPage,
  } = usePagination(filtered, 12);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-serif font-black text-primary-dark text-balance leading-none">
            Customer Database
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm">
            Manage your relationships and view lifetime value.
          </p>
        </div>
        <div className="relative w-full sm:w-72 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-transparent focus:border-primary/20 rounded-2xl py-3.5 sm:py-4 pl-11 pr-6 outline-none transition-all shadow-sm font-bold text-[13px] sm:text-sm placeholder:text-gray-300 focus:bg-white focus-visible:ring-4 focus-visible:ring-primary/5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {paginatedCustomers.map((customer, i) => (
          <motion.div
            key={customer._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-gray-50 hover:shadow-md transition-shadow group flex flex-col"
          >
            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/5 rounded-[1rem] sm:rounded-2xl flex items-center justify-center text-primary font-black text-lg sm:text-xl relative shadow-inner border border-primary/5">
                {customer.name[0]}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-lg border-2 sm:border-4 border-white flex items-center justify-center text-white shadow-sm">
                  <UserCheck size={10} className="sm:w-3" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-serif font-black text-primary-dark truncate">
                  {customer.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                  <Calendar size={10} className="sm:w-3" /> Joined{" "}
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 text-[11px] sm:text-sm text-gray-500 font-bold min-w-0">
                <Mail size={14} className="text-gray-300 shrink-0" />{" "}
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] sm:text-sm text-gray-500 font-bold">
                <Phone size={14} className="text-gray-300 shrink-0" />{" "}
                {customer.phone || "N/A"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-t border-gray-50">
              <div>
                <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
                  Orders
                </p>
                <div className="flex items-center gap-1.5 font-black text-primary-dark tabular-nums text-xs sm:text-sm">
                  <ShoppingBag size={14} className="text-primary/70" />{" "}
                  {customer.orderCount}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
                  Lifetime Value
                </p>
                <p className="font-black text-primary text-sm sm:text-lg tabular-nums">
                  ₹{customer.totalSpent?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/admin/orders?search=${encodeURIComponent(customer.email)}`,
                )
              }
              className="w-full mt-auto py-3.5 sm:py-4 bg-gray-50 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group active:scale-[0.98] active:bg-primary-dark focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              View Purchases{" "}
              <ChevronRight
                size={12}
                className="group-hover:translate-x-1 transition-transform sm:w-3.5"
              />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100">
          <ShieldAlert size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            No customers found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
