"use client";

import { Banknote, ClipboardList, Star, TriangleAlert } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/cn";

interface StatsCardsProps {
  revenue30d: number;
  ordersToday: number;
  lowStockCount: number;
  pendingReviews: number;
}

export function StatsCards({ revenue30d, ordersToday, lowStockCount, pendingReviews }: StatsCardsProps) {
  const { locale, t } = useLang();

  const stats = [
    {
      label: t.admin.dashboardView.revenue30d,
      value: formatCurrency(revenue30d, locale),
      icon: Banknote,
      iconClass: "text-accent",
    },
    {
      label: t.admin.dashboardView.ordersToday,
      value: ordersToday.toLocaleString(locale),
      icon: ClipboardList,
      iconClass: "text-info",
    },
    {
      label: t.admin.dashboardView.lowStockCount,
      value: lowStockCount.toLocaleString(locale),
      icon: TriangleAlert,
      iconClass: lowStockCount > 0 ? "text-warning" : "text-text-muted",
    },
    {
      label: t.admin.dashboardView.pendingReviews,
      value: pendingReviews.toLocaleString(locale),
      icon: Star,
      iconClass: pendingReviews > 0 ? "text-accent" : "text-text-muted",
    },
  ];

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-2xl border border-border bg-surface-raised p-5"
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full bg-surface",
              stat.iconClass,
            )}
          >
            <stat.icon aria-hidden className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-xs text-text-secondary">{stat.label}</span>
            <span className="text-2xl font-semibold leading-tight">{stat.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
