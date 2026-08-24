"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { useGetAdminProducts } from "@/hooks/admin/useGetAdminProducts";
import { useDeleteProduct } from "@/hooks/admin/useDeleteProduct";
import { formatCurrency } from "@/utils/format-currency";

type StatusFilter = "" | "draft" | "published" | "archived";

export function ProductsTable() {
  const { locale, t } = useLang();
  const deleteProduct = useDeleteProduct();

  const [searchDraft, setSearchDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const search = useDebounce(searchDraft, 300);

  const { data, isLoading } = useGetAdminProducts({ search, page: 1 });

  function handleDelete(id: string) {
    if (!window.confirm(t.admin.confirmDelete)) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => pushToast(t.common.saved, "success"),
        onError: (error) => pushToast(error.message || t.errors.generic, "error"),
      },
    );
  }

  const visibleItems =
    data?.items.filter((item) => (statusFilter ? item.status === statusFilter : true)) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t.admin.searchPlaceholder}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="max-w-40"
        >
          <option value="">{t.admin.ordersView.allStatuses}</option>
          <option value="draft">{t.statuses.productStatus.draft}</option>
          <option value="published">{t.statuses.productStatus.published}</option>
          <option value="archived">{t.statuses.productStatus.archived}</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.productsView.name}</th>
              <th className="p-3 text-start font-medium">{t.admin.productsView.category}</th>
              <th className="p-3 text-start font-medium">{t.admin.productsView.price}</th>
              <th className="p-3 text-start font-medium">{t.admin.productsView.stock}</th>
              <th className="p-3 text-start font-medium">{t.admin.status}</th>
              <th className="p-3 text-end font-medium">{t.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">
                  {t.common.noResults}
                </td>
              </tr>
            ) : (
              visibleItems.map((product) => (
                <tr key={product.id} className="border-t border-border first:border-t-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {product.coverImageUrl ? (
                          <Image src={product.coverImageUrl} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </div>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-accent">
                        {locale === "ar" ? product.nameAr : product.nameEn}
                      </Link>
                    </div>
                  </td>
                  <td className="p-3 text-text-secondary">
                    {locale === "ar" ? product.categoryNameAr : product.categoryNameEn}
                  </td>
                  <td className="p-3">{formatCurrency(product.price, locale)}</td>
                  <td className="p-3">{product.stockQuantity}</td>
                  <td className="p-3">
                    <Badge
                      tone={
                        product.status === "published"
                          ? "success"
                          : product.status === "draft"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {(t.statuses.productStatus as Record<string, string>)[product.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        aria-label={t.common.edit}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Link>
                      <button
                        type="button"
                        aria-label={t.common.delete}
                        onClick={() => handleDelete(product.id)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-muted hover:text-danger"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
