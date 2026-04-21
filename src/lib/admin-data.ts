import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Coupon from "@/models/Coupon";
import Settings from "@/models/Settings";
import ShippingRate from "@/models/ShippingRate";

const MASKED = "********";

export async function getAnalyticsData() {
  await connectDB();

  // Run all 3 aggregations in parallel (avoid data waterfall)
  const [salesByCategory, topProducts, paymentMethods] = await Promise.all([
    // 1. Sales by Category
    Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalAmount: {
            $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] },
          },
          count: { $sum: "$orderItems.qty" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
    // 2. Top Selling Products
    Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          totalSales: {
            $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] },
          },
          totalQty: { $sum: "$orderItems.qty" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]),
    // 3. Payment Method Distribution
    Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]),
  ]);

  return {
    salesByCategory,
    topProducts,
    paymentMethods,
  };
}

export async function getCustomersWithStats() {
  await connectDB();

  // Get all customers (and standard users)
  const customers = await User.find({ role: { $in: ["customer", "user"] } })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  // Collect ALL possible identifiers for each customer:
  // - MongoDB _id (ObjectId)
  // - better-auth id (string) — stored as (customer as any).id
  // - email
  const customerObjectIds = customers.map((c) => c._id);
  const customerStringIds = customers
    .map((c) => (c as any).id)
    .filter(Boolean);
  const customerEmails = customers.map((c) => c.email).filter(Boolean);

  // Match orders by any identifier
  const orderStats = await Order.aggregate([
    {
      $match: {
        $or: [
          { user: { $in: customerObjectIds } },
          { user: { $in: customerStringIds } },
          { "shippingAddress.email": { $in: customerEmails } },
        ],
      },
    },
    {
      $group: {
        _id: { $ifNull: ["$user", "$shippingAddress.email"] },
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: ["$isPaid", "$totalPrice", 0] } },
        latestPhone: { $first: "$shippingAddress.phone" },
      },
    },
  ]);

  // Build lookup map keyed by string representation
  const statsMap = new Map<string, any>();
  for (const stat of orderStats) {
    statsMap.set(String(stat._id), stat);
  }

  const customersWithStats = customers.map((customer) => {
    const mongoId = customer._id.toString();
    const authId = (customer as any).id;
    const email = customer.email;

    // Check all possible keys for this customer's orders
    const statByMongoId = statsMap.get(mongoId);
    const statByAuthId = authId ? statsMap.get(authId) : null;
    const statByEmail = statsMap.get(email) ||
                        statsMap.get(email?.toLowerCase()) ||
                        statsMap.get(email?.trim());

    // Deduplicate: collect unique stat entries (avoid double counting)
    const uniqueStats = new Set<any>();
    if (statByMongoId) uniqueStats.add(statByMongoId);
    if (statByAuthId) uniqueStats.add(statByAuthId);
    if (statByEmail) uniqueStats.add(statByEmail);

    let orderCount = 0;
    let totalSpent = 0;
    let latestPhone: string | undefined;
    for (const stat of uniqueStats) {
      orderCount += stat.orderCount;
      totalSpent += stat.totalSpent;
      if (!latestPhone) latestPhone = stat.latestPhone;
    }

    return {
      ...customer,
      phone: customer.phone || latestPhone,
      _id: mongoId,
      orderCount,
      totalSpent,
    };
  });

  return JSON.parse(JSON.stringify(customersWithStats));
}

export async function getCustomerByPhone(phone: string) {
  await connectDB();
  const customer = await User.findOne({
    phone,
    role: { $in: ["customer", "user"] },
  }).select("-password").lean();
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}

export async function getCategoriesData() {
  await connectDB();
  const categories = await Category.find({}).sort({ order: 1 }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function getCouponsData() {
  await connectDB();
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(coupons));
}

export async function getDashboardStats(range: string = "week") {
  await connectDB();

  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const istMidnightUTC = new Date(Date.UTC(
    istTime.getUTCFullYear(),
    istTime.getUTCMonth(),
    istTime.getUTCDate(),
    0, 0, 0, 0
  ));
  istMidnightUTC.setUTCHours(istMidnightUTC.getUTCHours() - 5, istMidnightUTC.getUTCMinutes() - 30);

  // Determine current and comparison period start dates
  let days = 7;
  if (range === "today") {
    days = 1;
  } else if (range === "month") {
    days = 30;
  }

  const currentPeriodStart = new Date(istMidnightUTC);
  currentPeriodStart.setUTCDate(istMidnightUTC.getUTCDate() - (days - 1));

  const prevPeriodStart = new Date(currentPeriodStart);
  prevPeriodStart.setUTCDate(currentPeriodStart.getUTCDate() - days);

  // Run ALL independent queries in parallel (avoid data waterfall)
  const [
    settings,
    productsCount,
    customersCount,
    lowStockCount,
    outOfStockCount,
    metrics,
    salesTrend,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    Settings.findOne().lean(),
    Product.countDocuments(),
    User.countDocuments({ role: { $in: ["customer", "user"] } }),
    Product.countDocuments({ stock: { $lte: 10, $gt: 0 } }),
    Product.countDocuments({ stock: 0 }),
    // Growth & Metrics Aggregation ($facet runs sub-pipelines in parallel)
    Order.aggregate([
      {
        $facet: {
          current: [
            { $match: { createdAt: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: { $cond: ["$isPaid", "$totalPrice", 0] } },
                orders: { $sum: 1 },
                pendingOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                },
                activeOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["Pending", "Processing", "Shipping"]] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          previous: [
            {
              $match: {
                createdAt: { $gte: prevPeriodStart, $lt: currentPeriodStart },
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: { $cond: ["$isPaid", "$totalPrice", 0] } },
                orders: { $sum: 1 },
              },
            },
          ],
          allTime: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: { $cond: ["$isPaid", "$totalPrice", 0] } },
                totalOrders: { $sum: 1 },
              },
            },
          ],
          statusDistribution: [
            { $match: { createdAt: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          revenueByCategory: [
            { $match: { isPaid: true, createdAt: { $gte: currentPeriodStart } } },
            { $unwind: "$orderItems" },
            {
              $lookup: {
                from: "products",
                localField: "orderItems.product",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $group: {
                _id: "$product.category",
                value: {
                  $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] },
                },
              },
            },
            { $sort: { value: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    // Sales Trend
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: currentPeriodStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: range === "today" ? "%H:00" : "%Y-%m-%d",
              date: "$createdAt",
              timezone: "+05:30",
            },
          },
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Stock Alerts
    Product.find({ stock: { $lte: 10, $gt: 0 } })
      .select("name stock uom images")
      .limit(5)
      .lean(),
    Product.find({ stock: 0 })
      .select("name stock uom images")
      .limit(5)
      .lean(),
    // Recent Orders
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email")
      .lean(),
    // Top Selling Products
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: currentPeriodStart } } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          totalSold: { $sum: "$orderItems.qty" },
          revenue: {
            $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const threshold = settings?.lowStockThreshold || 10;

  const m = metrics[0];
  const curStats = m.current[0] || {
    revenue: 0,
    orders: 0,
    pendingOrders: 0,
    activeOrders: 0,
  };
  const prevStats = m.previous[0] || { revenue: 0, orders: 0 };
  const allTimeStats = m.allTime[0] || { totalRevenue: 0, totalOrders: 0 };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(curStats.revenue, prevStats.revenue);
  const ordersGrowth = calculateGrowth(curStats.orders, prevStats.orders);

  // Fill Trend Data
  const chartData = [];
  if (range === "today") {
    const currentIstHour = istTime.getUTCHours();
    for (let i = 0; i <= currentIstHour; i++) {
      const hour = String(i).padStart(2, "0") + ":00";
      const found = salesTrend.find((item: any) => item._id === hour);
      chartData.push({
        date: hour,
        amount: found ? found.total : 0,
        orders: found ? found.count : 0,
      });
    }
  } else {
    for (let i = 0; i < days; i++) {
      const date = new Date(currentPeriodStart);
      date.setUTCDate(currentPeriodStart.getUTCDate() + i);

      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      const dateStr = istDate.toISOString().split("T")[0];

      const found = salesTrend.find((item: any) => item._id === dateStr);
      chartData.push({
        date:
          days > 7
            ? `${istDate.getUTCDate()} ${istDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}`
            : istDate.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }),
        amount: found ? found.total : 0,
        orders: found ? found.count : 0,
        fullDate: dateStr,
      });
    }
  }

  return JSON.parse(
    JSON.stringify({
      range,
      stats: {
        revenue: {
          current: curStats.revenue,
          previous: prevStats.revenue,
          total: allTimeStats.totalRevenue,
          growth: revenueGrowth,
        },
        orders: {
          current: curStats.orders,
          previous: prevStats.orders,
          total: allTimeStats.totalOrders,
          pending: curStats.pendingOrders,
          active: curStats.activeOrders,
          growth: ordersGrowth,
        },
        products: {
          total: productsCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        },
        customers: {
          total: customersCount,
        },
        statusDistribution: m.statusDistribution.reduce(
          (acc: any, cur: any) => {
            acc[cur._id || "Unknown"] = cur.count;
            return acc;
          },
          {},
        ),
        revenueByCategory: m.revenueByCategory,
      },
      stockAlerts: {
        low: lowStockProducts,
        out: outOfStockProducts,
      },
      salesTrend: chartData,
      recentOrders,
      topProducts,
    }),
  );
}

export async function getProductsData() {
  await connectDB();
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function getSettingsData() {
  await connectDB();
  const settings = await Settings.findOne();
  if (!settings) return {};

  const masked = settings.toObject();

  // Migration: Convert old taxRate to taxRates array
  if (
    masked.taxRate !== undefined &&
    (!masked.taxRates || masked.taxRates.length === 0)
  ) {
    masked.taxRates = [
      {
        name: "GST",
        rate: masked.taxRate,
        isDefault: true,
      },
    ];
    // Update in database
    await Settings.findOneAndUpdate(
      {},
      {
        taxRates: masked.taxRates,
        $unset: { taxRate: "" },
      },
    );
  }

  // Mask sensitive fields
  if (masked.payment?.razorpayKeySecret)
    masked.payment.razorpayKeySecret = MASKED;
  if (masked.payment?.razorpayWebhookSecret)
    masked.payment.razorpayWebhookSecret = MASKED;
  if (masked.smtp?.password) masked.smtp.password = MASKED;
  if (masked.googleMyBusiness?.apiKey) masked.googleMyBusiness.apiKey = MASKED;

  return JSON.parse(JSON.stringify(masked));
}

export async function getOrdersData() {
  await connectDB();
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .lean();
  return JSON.parse(JSON.stringify(orders));
}
export async function getShippingRatesData() {
  await connectDB();
  const rates = await ShippingRate.find({}).sort({ minAmount: 1 }).lean();
  return JSON.parse(JSON.stringify(rates));
}
