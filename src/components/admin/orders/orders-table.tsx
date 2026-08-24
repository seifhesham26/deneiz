"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { useGetOrders } from "@/hooks/admin/useGetOrders";
import { OrderStatusBadge } from "./order-status-badge";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export function OrdersTable() {
  const { locale, t } = useLang();
  const [searchDraft, setSearchDraft] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchDraft, 300);

  const { data, isLoading } = useGetOrders({
    page,
    search,
    status: status === "" ? undefined : (status as "pending" | "processing" | "shipped" | "delivered" | "cancelled"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t.admin.searchPlaceholder}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-44">
          <option value="">{t.admin.ordersView.allStatuses}</option>
          <option value="pending">{t.statuses.order.pending}</option>
          <option value="processing">{t.statuses.order.processing}</option>
          <option value="shipped">{t.statuses.order.shipped}</option>
          <option value="delivered">{t.statuses.order.delivered}</option>
          <option value="cancelled">{t.statuses.order.cancelled}</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.ordersView.orderNumber}</th>
              <th className="p-3 text-start font-medium">{t.admin.customer}</th>
              <th className="p-3 text-start font-medium">{t.admin.ordersView.items}</th>
              <th className="p-3 text-start font-medium">{t.admin.date}</th>
              <th className="p-3 text-start font-medium">{t.admin.status}</th>
              <th className="p-3 text-start font-medium">{t.admin.ordersView.paymentStatus}</th>
              <th className="p-3 text-end font-medium">{t.admin.total}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((order) => (
                <tr key={order.id} className="border-t border-border hover:bg-surface/60 first:border-t-0">
                  <td className="p-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold hover:text-accent" dir="ltr">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span>{order.fullName}</span>
                      <span className="text-xs text-text-muted" dir="ltr">
                        {order.phoneNumber}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">{order.itemCount}</td>
                  <td className="p-3 whitespace-nowrap">{formatDate(order.createdAt, locale)}</td>
                  <td className="p-3">
                    <OrderStatusBadge status={order.status} t={t} />
                  </td>
                  <td className="p-3 text-text-secondary">
                    {(t.statuses.payment as Record<string, string>)[order.paymentStatus] ?? order.paymentStatus}
                  </td>
                  <td className="p-3 text-end font-semibold">{formatCurrency(order.total, locale)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  {t.common.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / ADMIN_PAGE_SIZE))}
        onPageChange={setPage}
        className="mt-6"
      />
    </div>
  );
}
