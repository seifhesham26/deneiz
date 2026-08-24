"use client";

import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";

interface StatsCardsProps {
  revenue30d: number;
  ordersToday: number;
  lowStockCount: number;
  pendingReviews: number;
}

export function StatsCards({ revenue30d, ordersToday, lowStockCount, pendingReviews }: StatsCardsProps) {
  const { locale, t } = useLang();

  const stats = [
    { label: t.admin.dashboardView.revenue30d, value: formatCurrency(revenue30d, locale) },
    { label: t.admin.dashboardView.ordersToday, value: ordersToday.toLocaleString(locale) },
    { label: t.admin.dashboardView.lowStockCount, value: lowStockCount.toLocaleString(locale) },
    { label: t.admin.dashboardView.pendingReviews, value: pendingReviews.toLocaleString(locale) },
  ];

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 rounded-2xl border border-border bg-surface-raised p-5">
          <span className="text-xs text-text-secondary">{stat.label}</span>
          <span className="text-2xl font-semibold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
