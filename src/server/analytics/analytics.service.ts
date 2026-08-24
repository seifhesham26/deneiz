import { getDashboardStats, getRevenueByCategory, getSalesSeries, getTopSellingProducts } from "../orders/orders.db";
import { countLowStockProducts, listLowStockProducts } from "../products/products.db";
import { STORE_TIMEZONE } from "@/lib/constants";
import type { ANALYTICS_GRANULARITIES } from "./analytics.validators";

type Granularity = (typeof ANALYTICS_GRANULARITIES)[number];

/**
 * Revenue series are zero-filled so charts show continuous axes even when
 * some days have no sales — gaps would otherwise render as misleading drops.
 */
function fillDailySeries(
  rows: { bucket: string; revenue: number }[],
  days: number,
): { bucket: string; revenue: number }[] {
  const byBucket = new Map(rows.map((row) => [row.bucket, row.revenue]));
  const filled: { bucket: string; revenue: number }[] = [];
  // Store-local days, matching how the SQL buckets them — walking UTC here
  // would shift every label by the timezone offset
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE });
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = formatter.format(day);
    filled.push({ bucket: key, revenue: byBucket.get(key) ?? 0 });
  }
  return filled;
}


export async function getSalesOverTime(granularity: Granularity, days: number) {
  const rows = await getSalesSeries(days, granularity);
  if (granularity !== "daily") return rows;
  return fillDailySeries(rows, days);
}

export async function getTopProducts(limit: number, days = 90) {
  return getTopSellingProducts(limit, days);
}

export async function getCategoryRevenue() {
  return getRevenueByCategory();
}

export async function buildDashboardSnapshot(threshold: number) {
  const [stats, lowStock, lowStockCount] = await Promise.all([
    getDashboardStats(),
    listLowStockProducts(threshold),
    countLowStockProducts(threshold),
  ]);

  return {
    revenue30d: stats.revenue30d,
    ordersToday: stats.ordersToday,
    pendingReviews: stats.pendingReviews,
    // A COUNT(*), not the length of a list limited to 10 — the KPI read "10"
    // whether there were ten low-stock products or two hundred
    lowStockCount,
    recentOrders: stats.recentOrders,
    revenueSeries: stats.revenueSeries,
    lowStock,
  };
}
