"use client";

import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";

interface TopProductsTableProps {
  products: {
    productId: string | null;
    nameEn: string;
    nameAr: string;
    unitsSold: number;
    revenue: number;
  }[];
  isLoading?: boolean;
}

export function TopProductsTable({ products, isLoading }: TopProductsTableProps) {
  const { locale, t } = useLang();

  return (
    <section className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
      <h2 className="p-5 pb-3 text-sm font-medium">{t.admin.analyticsView.topProducts}</h2>
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-secondary">
            <th className="p-3 text-start font-medium">{t.admin.productsView.name}</th>
            <th className="p-3 text-start font-medium">{t.admin.analyticsView.unitsSold}</th>
            <th className="p-3 text-end font-medium">{t.admin.analyticsView.revenue}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="p-8 text-center text-text-secondary">
                {t.common.loading}
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-8 text-center text-text-secondary">
                {t.common.noResults}
              </td>
            </tr>
          ) : (
            products.map((product, index) => (
              // Composite key: productId is nullable for deleted catalog items
              <tr key={product.productId ?? `deleted-${index}`} className="border-t border-border first:border-t-0">
                <td className="max-w-56 truncate p-3 font-medium">
                  {locale === "ar" ? product.nameAr : product.nameEn}
                </td>
                <td className="p-3">{product.unitsSold}</td>
                <td className="p-3 text-end font-semibold">{formatCurrency(product.revenue, locale)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
