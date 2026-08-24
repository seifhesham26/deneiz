"use client";

import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";
import { useRevenueByCategory } from "@/hooks/admin/useRevenueByCategory";

export function CategoryRevenueList() {
  const { locale, t } = useLang();
  const { data, isLoading } = useRevenueByCategory();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="text-sm font-medium">{t.admin.analyticsView.revenueByCategory}</h2>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {data.map((row) => (
            <li key={row.categoryId ?? "uncategorized"} className="flex items-center justify-between py-2 text-sm">
              <span>{locale === "ar" ? row.categoryNameAr ?? "—" : row.categoryNameEn ?? "—"}</span>
              <span className="font-semibold">{formatCurrency(row.revenue, locale)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-muted">—</p>
      )}
    </section>
  );
}
