"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { useSalesOverTime } from "@/hooks/admin/useSalesOverTime";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { TopProductsTable } from "./top-products-table";
import { useTopProducts } from "@/hooks/admin/useTopProducts";

type Granularity = "daily" | "weekly" | "monthly";

export function SalesChart() {
  const { t } = useLang();
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const salesQuery = useSalesOverTime(granularity, 90);
  const topProducts = useTopProducts(10);

  const options: { value: Granularity; label: string }[] = [
    { value: "daily", label: t.admin.analyticsView.daily },
    { value: "weekly", label: t.admin.analyticsView.weekly },
    { value: "monthly", label: t.admin.analyticsView.monthly },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t.admin.analyticsView.salesOverTime}</h2>
          <div className="flex gap-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGranularity(option.value)}
                aria-pressed={granularity === option.value}
                className={`min-h-11 rounded-full px-4 text-xs font-medium transition-colors ${
                  granularity === option.value
                    ? "bg-primary text-text-inverse"
                    : "text-text-secondary hover:bg-surface"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reuses the dashboard bar renderer with the selected granularity */}
        <RevenueChart series={salesQuery.data ?? []} isLoading={salesQuery.isLoading} />
      </section>

      <TopProductsTable products={topProducts.data ?? []} isLoading={topProducts.isLoading} />
    </div>
  );
}
