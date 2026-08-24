"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/admin/dashboard/stats-cards";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { RecentOrdersTable } from "@/components/admin/dashboard/recent-orders-table";
import { LowStockAlert } from "@/components/admin/dashboard/low-stock-alert";
import { useGetAnalytics } from "@/hooks/admin/useGetAnalytics";

export default function AdminDashboardPage() {
  const { t } = useLang();
  const { data, isLoading } = useGetAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t.admin.dashboard}</h1>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus aria-hidden className="size-4" />
            {t.admin.newProduct}
          </Button>
        </Link>
      </div>

      <StatsCards
        revenue30d={data?.revenue30d ?? 0}
        ordersToday={data?.ordersToday ?? 0}
        lowStockCount={data?.lowStockCount ?? 0}
        pendingReviews={data?.pendingReviews ?? 0}
      />

      <RevenueChart series={data?.revenueSeries ?? []} isLoading={isLoading} />

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}
      >
        <RecentOrdersTable orders={data?.recentOrders ?? []} isLoading={isLoading} />
        <LowStockAlert products={data?.lowStock ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
