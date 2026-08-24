"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { useGetInventory } from "@/hooks/admin/useGetInventory";
import { useGetStockHistory } from "@/hooks/admin/useGetStockHistory";
import { StockAdjustmentForm } from "./stock-adjustment-form";
import { formatDateTime } from "@/utils/format-date";

export function StockTable() {
  const { locale, t } = useLang();
  const [searchDraft, setSearchDraft] = useState("");
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const search = useDebounce(searchDraft, 300);

  const { data, isLoading } = useGetInventory({ search, page });
  const history = useGetStockHistory(adjustingProductId ?? undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t.admin.searchPlaceholder}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          className="max-w-xs"
        />
        <Badge tone="warning">{`${t.admin.dashboardView.lowStockCount}: ${data?.lowStockCount ?? 0}`}</Badge>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.productsView.name}</th>
              <th className="p-3 text-start font-medium">{t.admin.inventoryView.currentStock}</th>
              <th className="p-3 text-start font-medium">{t.admin.status}</th>
              <th className="p-3 text-end font-medium">{t.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : (
              data?.items.map((product) => (
                <tr key={product.id} className="border-t border-border first:border-t-0">
                  <td className="p-3 font-medium">
                    {locale === "ar" ? product.nameAr : product.nameEn}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        product.stockQuantity === 0
                          ? "font-semibold text-danger"
                          : product.stockQuantity <= 5
                            ? "font-semibold text-warning"
                            : ""
                      }
                    >
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-text-secondary">
                    {(t.statuses.productStatus as Record<string, string>)[product.status]}
                  </td>
                  <td className="p-3 text-end">
                    <Button size="sm" variant="outline" onClick={() => setAdjustingProductId(product.id)}>
                      {t.admin.inventoryView.adjust}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={adjustingProductId !== null}
        onClose={() => setAdjustingProductId(null)}
        title={t.admin.inventoryView.adjust}
      >
        {adjustingProductId ? (
          <div className="flex flex-col gap-6">
            <StockAdjustmentForm productId={adjustingProductId} onDone={() => setAdjustingProductId(null)} />

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-medium">{t.admin.inventoryView.history}</h3>
              {history.data && history.data.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border text-xs">
                  {history.data.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-2 py-2">
                      <span
                        className={`font-mono font-semibold ${
                          entry.changeAmount > 0 ? "text-success" : "text-danger"
                        }`}
                        dir="ltr"
                      >
                        {entry.changeAmount > 0 ? `+${entry.changeAmount}` : entry.changeAmount}
                      </span>
                      <span>{entry.reason}</span>
                      <span className="text-text-muted">{formatDateTime(entry.createdAt, locale)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-muted">—</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / ADMIN_PAGE_SIZE))}
        onPageChange={setPage}
        className="mt-6"
      />
    </div>
  );
}
