"use client";

import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format-date";
import { formatCurrency } from "@/utils/format-currency";
import type { Dictionary } from "@/lib/dictionary";

interface RecentOrdersTableProps {
  orders: {
    id: string;
    orderNumber: string;
    fullName: string;
    status: string;
    total: number;
    createdAt: string | Date;
  }[];
  isLoading?: boolean;
}

export function orderStatusTone(status: string): "warning" | "info" | "success" | "danger" | "neutral" {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
    case "shipped":
      return "info";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function translateOrderStatus(status: string, t: Dictionary): string {
  const map = t.statuses.order as Record<string, string>;
  return map[status] ?? status;
}

export function RecentOrdersTable({ orders, isLoading }: RecentOrdersTableProps) {
  const { locale, t } = useLang();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{t.admin.dashboardView.recentOrders}</h2>
        <Link href="/admin/orders" className="text-xs text-accent hover:underline">
          {t.admin.dashboardView.viewAllOrders}
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-start text-xs text-text-secondary">
              <th className="pb-2 text-start font-medium">{t.admin.ordersView.orderNumber}</th>
              <th className="pb-2 text-start font-medium">{t.admin.customer}</th>
              <th className="pb-2 text-start font-medium">{t.admin.date}</th>
              <th className="pb-2 text-start font-medium">{t.admin.status}</th>
              <th className="pb-2 text-end font-medium">{t.admin.total}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-2.5 font-mono text-xs" dir="ltr">
                    {order.orderNumber}
                  </td>
                  <td className="max-w-32 truncate py-2.5">{order.fullName}</td>
                  <td className="py-2.5 whitespace-nowrap">{formatDate(order.createdAt, locale)}</td>
                  <td className="py-2.5">
                    <Badge tone={orderStatusTone(order.status)}>
                      {translateOrderStatus(order.status, t)}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-end font-semibold">{formatCurrency(order.total, locale)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
