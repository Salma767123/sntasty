"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  Briefcase,
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await fetch("/api/admin/enquiries");
        const data = await res.json();
        if (Array.isArray(data)) {
          setEnquiries(data);
        } else {
          console.error("Invalid data format", data);
        }
      } catch (error) {
        console.error("Failed to fetch enquiries", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  const GENERAL_TYPES = ["General Inquiry", "Order Support", "Product Question", "Feedback"];

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      (filter === "General" ? GENERAL_TYPES.includes(enq.type) : enq.type === filter);
    const matchesStatus = statusFilter === "All" || enq.status === statusFilter;

    return matchesSearch && matchesFilter && matchesStatus;
  });

  const STATUS_ORDER = ["New", "In Progress", "Completed"] as const;

  const getNextStatuses = (current: string): string[] => {
    const idx = STATUS_ORDER.indexOf(current as any);
    if (idx === -1) return [...STATUS_ORDER];
    return STATUS_ORDER.slice(idx) as unknown as string[];
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const enq = enquiries.find((e) => e._id === id);
    if (enq) {
      const currentIdx = STATUS_ORDER.indexOf(enq.status);
      const newIdx = STATUS_ORDER.indexOf(newStatus as any);
      if (newIdx < currentIdx) {
        toast.error("Status cannot be reverted to a previous stage");
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        toast.success("Enquiry status updated");
        setEnquiries(
          enquiries.map((enq) =>
            enq._id === id ? { ...enq, status: newStatus } : enq,
          ),
        );
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Corporate Booking":
        return <Briefcase size={14} />;
      case "Event Catering":
        return <Calendar size={14} />;
      case "Bulk Order":
        return <Users size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-primary-dark tracking-tighter text-balance">
            Event Enquiries
          </h1>
          <p className="text-gray-400 font-medium text-xs sm:text-sm">
            Manage corporate bookings and catering requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full lg:w-auto">
          {["All", "General", "Corporate Booking", "Event Catering", "Bulk Order"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-grow sm:flex-grow-0 px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${filter === tab ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-primary hover:bg-gray-50"}`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-grow max-w-md w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-primary/20 rounded-2xl text-[13px] font-bold text-primary-dark outline-none transition-all placeholder:text-gray-300 focus:bg-white touch-manipulation shadow-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-widest rounded-2xl px-4 py-3 pr-10 outline-none transition-all hover:border-gray-300 focus:border-primary/20 focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm min-w-[160px]"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Mobile Enquiry Cards */}
        <div className="lg:hidden p-4 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-50">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Syncing Requests...
              </span>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-gray-300">
              <Briefcase size={48} strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                No Enquiries
              </span>
            </div>
          ) : (
            filteredEnquiries.map((enq) => (
              <motion.div
                layout
                key={enq._id}
                className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-primary-dark text-sm truncate uppercase tracking-tight">
                      {enq.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold truncate">
                      {enq.email}
                    </span>
                    <span className="text-[10px] text-primary/70 font-black mt-1">
                      {enq.phone}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusColor(enq.status)}`}
                    >
                      {enq.status}
                    </span>
                    <div className="text-[9px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
                      <Clock size={10} />{" "}
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                      {getTypeIcon(enq.type)}
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {enq.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-3 italic">
                    "{enq.message}"
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="relative flex-grow">
                    <select
                      value={enq.status}
                      onChange={(e) => updateStatus(enq._id, e.target.value)}
                      disabled={enq.status === "Completed"}
                      className="w-full appearance-none bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl px-4 py-3 outline-none transition-all hover:bg-primary-dark focus:ring-4 focus:ring-primary/10 touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {getNextStatuses(enq.status).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-8 py-6 pl-10">Client Details</th>
                <th className="px-8 py-6">Request Type</th>
                <th className="px-8 py-6">Message / Requirements</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 pr-10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Loading Requests...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <Briefcase size={40} strokeWidth={1} />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        No Enquiries Found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq, i) => (
                  <tr
                    key={enq._id}
                    className="group hover:bg-secondary/5 transition-colors"
                  >
                    <td className="px-8 py-6 pl-10">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary-dark text-sm">
                          {enq.name}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {enq.email}
                        </span>
                        <span className="text-[10px] text-primary/60 font-black tracking-wider mt-1">
                          {enq.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                          {getTypeIcon(enq.type)}
                        </div>
                        <span className="text-xs font-bold text-gray-600">
                          {enq.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {enq.message}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(enq.status)}`}
                      >
                        {enq.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 pr-10 text-right">
                      <div className="relative inline-block">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            updateStatus(enq._id, e.target.value)
                          }
                          disabled={enq.status === "Completed"}
                          className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-xl px-3 py-2 pr-8 outline-none transition-colors hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-primary/20 touch-manipulation cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {getNextStatuses(enq.status).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
