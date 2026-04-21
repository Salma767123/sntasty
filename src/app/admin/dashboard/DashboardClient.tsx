"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Truck,
  MoreHorizontal,
  Plus,
  FileText,
  Ticket,
  Eye,
  Activity,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  range: string;
  stats: {
    revenue: {
      current: number;
      previous: number;
      total: number;
      growth: number;
    };
    orders: {
      current: number;
      previous: number;
      total: number;
      pending: number;
      active: number;
      growth: number;
    };
    products: {
      total: number;
      lowStock: number;
      outOfStock: number;
    };
    customers: {
      total: number;
    };
    statusDistribution: Record<string, number>;
    revenueByCategory: { _id: string; value: number }[];
  };
  stockAlerts: {
    low: any[];
    out: any[];
  };
  salesTrend: {
    date: string;
    amount: number;
    orders: number;
    fullDate?: string;
  }[];
  recentOrders: any[];
  topProducts: {
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
}

const COLORS = ["#234d1b", "#f8bf51", "#8b4513", "#556b2f", "#d2691e"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">(
    (initialData.range as any) || "week",
  );

  useEffect(() => {
    if (dateRange === initialData.range && data === initialData) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats?range=${dateRange}`);
        const stats = await res.json();
        if (res.ok) {
          setData(stats);
        } else {
          console.error("Failed to fetch stats:", stats.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
          isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {Math.abs(value).toFixed(1)}%
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-[#234d1b] border-t-[#f8bf51] rounded-full animate-spin mb-4" />
        <p className="text-[#234d1b] font-black uppercase tracking-widest text-[10px]">
          Processing Live Data...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20 px-0 sm:px-0"
    >
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between lg:items-center gap-4 sm:gap-6">
          <div className="min-w-0">
            <motion.h1
              variants={itemVariants}
              className="text-xl sm:text-3xl lg:text-5xl font-serif font-black text-[#234d1b] leading-none"
            >
              Dashboard
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-gray-400 mt-2 font-medium flex items-center gap-2 text-[10px] sm:text-sm truncate"
            >
              <Zap
                size={14}
                className="text-[#f8bf51] fill-[#f8bf51] shrink-0"
              />
              Live overview for{" "}
              <span className="text-[#234d1b] font-black underline decoration-[#f8bf51]/50">
                Sai Nandhini
              </span>
            </motion.p>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex bg-gray-50/50 p-1 rounded-xl sm:rounded-2xl border border-gray-100 gap-1 w-full sm:w-auto"
          >
            {(["today", "week", "month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all touch-manipulation whitespace-nowrap ${
                  dateRange === r
                    ? "bg-[#234d1b] text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-gray-400 hover:text-[#234d1b] hover:bg-white"
                }`}
              >
                {r}
              </button>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp
              size={60}
              className="text-[#234d1b] sm:w-[80px] sm:h-[80px]"
            />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-green-50 text-[#234d1b] rounded-xl sm:rounded-2xl">
                <TrendingUp size={20} className="sm:w-6 sm:h-6" />
              </div>
              <GrowthIndicator value={data.stats.revenue.growth} />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
                Period Revenue
              </p>
              <h3 className="text-xl sm:text-3xl font-serif font-black text-[#234d1b]">
                {formatCurrency(data.stats.revenue.current)}
              </h3>
              <p className="text-[8px] sm:text-[10px] text-gray-400 mt-2.5 flex items-center gap-1 font-medium italic">
                Life: {formatCurrency(data.stats.revenue.total)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Orders Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 group-hover:scale-110 transition-transform">
            <ShoppingBag
              size={60}
              className="text-[#f8bf51] sm:w-[80px] sm:h-[80px]"
            />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-amber-50 text-[#f8bf51] rounded-xl sm:rounded-2xl">
                <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
              </div>
              <GrowthIndicator value={data.stats.orders.growth} />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
                New Transactions
              </p>
              <h3 className="text-xl sm:text-3xl font-serif font-black text-[#234d1b]">
                {data.stats.orders.current}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="text-[8px] sm:text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                  {data.stats.orders.pending} Wait
                </span>
                <span className="text-[8px] sm:text-[9px] font-black px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100">
                  {data.stats.orders.active - data.stats.orders.pending} Done
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Layers
              size={60}
              className="text-indigo-600 sm:w-[80px] sm:h-[80px]"
            />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
                <Layers size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
                Active Catalog
              </p>
              <h3 className="text-xl sm:text-3xl font-serif font-black text-[#234d1b]">
                {data.stats.products.total}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="text-[8px] sm:text-[9px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-lg">
                  Active Online
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Customers Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Users
              size={60}
              className="text-emerald-600 sm:w-[80px] sm:h-[80px]"
            />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl">
                <Users size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Customer Base
              </p>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#234d1b]">
                {data.stats.customers.total}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
                Verified Profiles
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Performance Graph */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white p-4 sm:p-6 md:p-10 rounded-[2rem] sm:rounded-[40px] shadow-sm border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 md:mb-10">
            <div>
              <h3 className="text-lg md:text-2xl font-serif font-black text-[#234d1b] text-balance">
                Revenue Velocity
              </h3>
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">
                Transaction Performance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#234d1b]" />
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  Revenue
                </span>
              </div>
            </div>
          </div>

          <div className="h-[250px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#234d1b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#234d1b" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="5 5"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: "#9CA3AF" }}
                  dy={15}
                />
                <YAxis hide domain={[0, "auto"]} />
                <RechartsTooltip
                  cursor={{
                    stroke: "#234d1b",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#234d1b] text-white p-5 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#f8bf51] mb-2">
                            {payload[0].payload.fullDate ||
                              payload[0].payload.date}
                          </p>
                          <div className="space-y-2 font-serif">
                            <div className="flex flex-col">
                              <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">
                                Revenue
                              </span>
                              <span className="text-lg font-black">
                                {formatCurrency(payload[0].value as number)}
                              </span>
                            </div>
                            <div className="flex flex-col border-t border-white/10 pt-2">
                              <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">
                                Orders
                              </span>
                              <span className="text-xs font-bold">
                                {payload[0].payload.orders} Transactions
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#234d1b"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-4 sm:p-6 md:p-10 rounded-[2rem] sm:rounded-[40px] shadow-sm border border-gray-100 flex flex-col"
        >
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg md:text-2xl font-serif font-black text-[#234d1b] text-balance">
              Order Split
            </h3>
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">
              Status Distribution
            </p>
          </div>

          <div className="h-64 relative flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(data.stats.statusDistribution).map(
                    ([name, value]) => ({ name, value }),
                  )}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {Object.entries(data.stats.statusDistribution).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth={2}
                      />
                    ),
                  )}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#234d1b] text-white px-4 py-2 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest">
                          {payload[0].name}: {payload[0].value}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  Total
                </p>
                <p className="text-2xl font-serif font-black text-[#234d1b]">
                  {data.stats.orders.current}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-50 pt-8">
            {Object.entries(data.stats.statusDistribution).map(
              ([label, value], i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full`}
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                  <span className="text-sm font-serif font-black text-[#234d1b] pl-4">
                    {value}
                  </span>
                </div>
              ),
            )}
          </div>
        </motion.div>
      </div>

      {/* Second Row: Best Sellers & Category Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 md:p-10 rounded-[40px] shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-black text-[#234d1b] text-balance">
                Signature Items
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
                Volume Performance
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {data.topProducts.map((product, i) => (
              <div key={product._id} className="group relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#234d1b] uppercase tracking-tight">
                    {product.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {product.totalSold} sold
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(product.totalSold / data.topProducts[0].totalSold) * 100}%`,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#234d1b] to-[#f8bf51] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Revenue by Category */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 md:p-10 rounded-[40px] shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-black text-[#234d1b] text-balance">
                Profit Centers
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
                Revenue by Category
              </p>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.stats.revenueByCategory}
                margin={{ left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f8f8f8"
                />
                <XAxis
                  dataKey="_id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: "#9CA3AF" }}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: "#f8f8f8" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#234d1b] text-white px-4 py-2 rounded-2xl shadow-xl font-serif font-black text-xs">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#234d1b"
                  radius={[12, 12, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {data.stats.revenueByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#234d1b" : "#234d1b33"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-5 md:p-10 rounded-[40px] shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 md:mb-10">
          <div>
            <h3 className="text-xl md:text-2xl font-serif font-black text-[#234d1b] text-balance">
              Recent Transactions
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Audit Trail
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="group flex items-center gap-2 px-6 py-2.5 bg-gray-50 hover:bg-[#234d1b] text-[#234d1b] hover:text-white rounded-2xl transition-colors duration-300 font-black text-[10px] uppercase tracking-widest self-start sm:self-auto"
          >
            Full Ledger
            <ChevronRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-left text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="pb-6 pl-4">Client</th>
                <th className="pb-6">Reference</th>
                <th className="pb-6">Amount</th>
                <th className="pb-6">Stage</th>
                <th className="pb-6 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="group hover:bg-[#f8bf51]/5 transition-colors"
                >
                  <td className="py-6 pl-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-[#234d1b] text-xs font-black border border-gray-200">
                        {order.shippingAddress?.fullName?.[0] || "G"}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#234d1b] tracking-tight">
                          {order.shippingAddress?.fullName || "Guest"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full font-black uppercase tracking-widest border border-gray-100">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-6 text-sm font-serif font-black text-[#234d1b]">
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          order.status === "Delivered"
                            ? "bg-green-500"
                            : order.status === "Pending"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 text-right pr-4">
                    <Link
                      href={`/admin/orders?id=${order._id}`}
                      className="p-2 text-gray-300 hover:text-[#234d1b] hover:bg-gray-50 rounded-xl transition-colors inline-block"
                    >
                      <ExternalLink size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          {data.recentOrders.map((order) => (
            <div
              key={order._id}
              className="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#234d1b] font-black text-xs">
                    {order.shippingAddress?.fullName?.[0] || "G"}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#234d1b] leading-none mb-1">
                      {order.shippingAddress?.fullName || "Guest"}
                    </h4>
                    <span className="text-[9px] font-bold text-gray-400 font-mono">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-black text-[#234d1b] leading-none mb-1">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-gray-100">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${order.status === "Delivered" ? "bg-green-500" : "bg-amber-500"}`}
                    />
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100/50">
                <Link
                  href={`/admin/orders?id=${order._id}`}
                  className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#234d1b] active:scale-95 transition-all"
                >
                  <Eye size={12} />
                  View Track
                </Link>
                <div className="px-3 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <span className="text-[8px] font-black italic">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
