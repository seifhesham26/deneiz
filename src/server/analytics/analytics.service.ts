import { getDashboardStats, getRevenueByCategory, getSalesSeries, getTopSellingProducts } from "../orders/orders.db";
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
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    filled.push({ bucket: key, revenue: byBucket.get(key) ?? 0 });
  }
  return filled;
}

export async function getRevenueTrend(days = 30) {
  const stats = await getDashboardStats();
  return fillDailySeries(stats.revenueSeries, days);
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
  const [stats, lowStock] = await Promise.all([
    getDashboardStats(),
    import("@/server/products/products.db").then((module) =>
      module.listLowStockProducts(threshold),
    ),
  ]);

  return {
    revenue30d: stats.revenue30d,
    ordersToday: stats.ordersToday,
    pendingReviews: stats.pendingReviews,
    lowStockCount: lowStock.length,
    recentOrders: stats.recentOrders,
    revenueSeries: stats.revenueSeries,
    lowStock,
  };
}
