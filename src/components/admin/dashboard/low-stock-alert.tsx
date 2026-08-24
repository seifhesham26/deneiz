"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";

interface LowStockAlertProps {
  products: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    stockQuantity: number;
  }[];
  isLoading?: boolean;
}

export function LowStockAlert({ products, isLoading }: LowStockAlertProps) {
  const { locale, t } = useLang();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <TriangleAlert aria-hidden className="size-4 text-warning" />
        {t.admin.dashboardView.lowStockAlert}
      </h2>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : products.length === 0 ? (
        <p className="text-xs text-text-muted">—</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <Link href={`/admin/products/${product.id}`} className="truncate hover:text-accent">
                {locale === "ar" ? product.nameAr : product.nameEn}
              </Link>
              <span className={`font-semibold ${product.stockQuantity === 0 ? "text-danger" : "text-warning"}`}>
                {product.stockQuantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
