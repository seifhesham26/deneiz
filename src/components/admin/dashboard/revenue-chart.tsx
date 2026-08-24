"use client";

import { useLang } from "@/components/providers/lang-provider";

interface RevenueChartProps {
  series: { bucket: string; revenue: number }[];
  isLoading?: boolean;
}

const CHART_HEIGHT = 160;
const BAR_MIN_WIDTH = 6;

/** Dependency-free SVG bar chart — adequate for admin trends without a chart lib. */
export function RevenueChart({ series, isLoading }: RevenueChartProps) {
  const { locale, t } = useLang();

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface" aria-busy="true" />;
  }

  const max = Math.max(1, ...series.map((point) => point.revenue));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="text-sm font-medium">{t.admin.dashboardView.revenueChart}</h2>

      <svg
        viewBox={`0 0 ${Math.max(series.length * (BAR_MIN_WIDTH + 2), 100)} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={t.admin.dashboardView.revenueChart}
      >
        {series.map((point, index) => {
          const barHeight = Math.round((point.revenue / max) * (CHART_HEIGHT - 8));
          return (
            <rect
              key={point.bucket}
              x={index * (BAR_MIN_WIDTH + 2)}
              y={CHART_HEIGHT - barHeight}
              width={BAR_MIN_WIDTH}
              height={barHeight}
              rx={2}
              className="fill-accent"
            >
              <title>{`${point.bucket}: ${point.revenue.toLocaleString(locale)}`}</title>
            </rect>
          );
        })}
      </svg>

      <div className="flex justify-between text-xs text-text-muted" dir="ltr">
        <span>{series[0]?.bucket ?? ""}</span>
        <span>{series[series.length - 1]?.bucket ?? ""}</span>
      </div>
    </div>
  );
}
