"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  PieChart,
  Search,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  CreditCard,
  Zap,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart as ReChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#234d1b", "#f8bf51", "#8B4513", "#D2691E", "#CD853F"];

export default function AnalyticsClient({ initialData }: { initialData: any }) {
  const [data] = useState<any>(initialData);
  const [loading] = useState(false);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!data || data.error || !data.salesByCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-xl font-bold text-red-500 mb-2">
          Unable to load dashboard
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-serif font-black text-primary-dark text-balance leading-tight">
            Intelligence & Insights
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 font-medium text-[10px] sm:text-sm">
            Deep dive into your sales patterns and customer behavior.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => (window.location.href = "/api/admin/reports/orders")}
            className="flex-grow sm:flex-grow-0 bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-primary-dark focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation text-[10px] sm:text-xs"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="uppercase tracking-widest">Report</span>
          </button>
          <div className="flex-grow sm:flex-grow-0 bg-primary/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center gap-2 sm:gap-4 border border-primary/5">
            <TrendingUp
              size={16}
              className="text-primary sm:w-[20px] sm:h-[20px]"
            />
            <div>
              <p className="text-[7px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                Growth
              </p>
              <p className="text-[10px] sm:text-sm font-bold text-primary tabular-nums leading-none">
                +24.8%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {/* Category Performance */}
        <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h3 className="text-sm sm:text-xl font-serif font-black text-primary-dark flex items-center gap-2 text-balance">
              <PieChart
                size={18}
                className="text-primary sm:w-[20px] sm:h-[20px]"
              />{" "}
              Category Revenue
            </h3>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Distribution
            </span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 items-center">
            <div className="h-40 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReChart>
                  <Pie
                    data={data.salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="totalAmount"
                    nameKey="_id"
                  >
                    {data.salesByCategory.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "1rem",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) =>
                      `₹${(value || 0).toLocaleString()}`
                    }
                  />
                </ReChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {data.salesByCategory.map((cat: any, i: number) => (
                <div key={cat._id} className="space-y-2">
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-bold text-primary-dark truncate">
                        {cat._id}
                      </span>
                    </div>
                    <span className="font-bold text-gray-400 tabular-nums shrink-0 ml-2">
                      ₹{cat.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.totalAmount / data.salesByCategory[0].totalAmount) * 100}%`,
                      }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full shadow-sm"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 focus-within:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h3 className="text-sm sm:text-xl font-serif font-black text-primary-dark flex items-center gap-2 text-balance">
              <Award
                size={18}
                className="text-primary sm:w-[20px] sm:h-[20px]"
              />{" "}
              Top Delicacies
            </h3>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              By Revenue
            </span>
          </div>
          <div className="space-y-6 sm:space-y-8">
            <div className="h-40 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.topProducts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#F1F1F1"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#234d1b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "1rem",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) =>
                      `₹${(value || 0).toLocaleString()}`
                    }
                  />
                  <Bar
                    dataKey="totalSales"
                    fill="#f8bf51"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {data.topProducts.map((prod: any, i: number) => (
                <div
                  key={prod._id}
                  className="flex items-center gap-3 sm:gap-4 bg-gray-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-primary text-[10px] sm:text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-primary-dark truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 tabular-nums">
                      {prod.totalQty} Units
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-black text-primary-dark tabular-nums">
                      ₹{prod.totalSales.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-xl font-serif font-black text-primary-dark mb-6 sm:mb-10 flex items-center gap-2 text-balance">
            <CreditCard
              size={18}
              className="text-primary sm:w-[20px] sm:h-[20px]"
            />{" "}
            Payment Mix
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 items-center">
            <div className="h-40 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReChart>
                  <Pie
                    data={data.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="totalAmount"
                    nameKey="_id"
                  >
                    {data.paymentMethods.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#234d1b" : "#f8bf51"}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "1rem",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) =>
                      `₹${(value || 0).toLocaleString()}`
                    }
                  />
                </ReChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {data.paymentMethods.map((method: any, index: number) => (
                <div
                  key={method._id}
                  className="p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{
                        backgroundColor: index === 0 ? "#234d1b" : "#f8bf51",
                      }}
                    >
                      <Zap size={12} className="sm:w-[14px] sm:h-[14px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase truncate">
                        {method._id}
                      </p>
                      <p className="text-xs sm:text-sm font-black text-primary-dark tabular-nums truncate">
                        ₹{method.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-black text-primary tabular-nums shrink-0 ml-2">
                    {method.count} TRX
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-primary-dark p-6 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-xl text-white relative overflow-hidden flex flex-col justify-center border-4 border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-lg sm:text-2xl font-serif font-black mb-3 sm:mb-4 relative z-10 text-balance leading-tight">
            AI Strategy Insight
          </h3>
          <p className="text-primary-light font-medium leading-relaxed mb-6 sm:mb-8 relative z-10 text-xs sm:text-sm">
            Your "Sweets" category has grown by 24% this week. We recommend
            featuring **"Ghee Mysore Pak"** on the hero banner to drive more
            conversions during the upcoming festival season.
          </p>
          <button className="bg-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2 w-full sm:w-fit relative z-10 hover:bg-secondary hover:text-primary-dark transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-light touch-manipulation active:scale-[0.98]">
            Apply Optimization{" "}
            <ArrowRight size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
