"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { useGetOrderById } from "@/hooks/admin/useGetOrderById";
import { useUpdateOrderStatus } from "@/hooks/admin/useUpdateOrderStatus";
import { useSetPaymentStatus } from "@/hooks/admin/useSetPaymentStatus";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

export default function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = use(params);
  const { locale, t } = useLang();
  const router = useRouter();
  const updateStatus = useUpdateOrderStatus();
  const setPaymentStatus = useSetPaymentStatus();
  const { data: order, isLoading } = useGetOrderById(id);
  const [statusDraft, setStatusDraft] = useState("");

  function changeStatus(next: string) {
    updateStatus.mutate(
      { id, status: next as "pending" | "processing" | "shipped" | "delivered" | "cancelled" },
      {
        onSuccess: () => pushToast(t.admin.ordersView.orderUpdated, "success"),
        onError: (error) => {
          pushToast(translateError(error, t), "error");
          router.refresh();
        },
      },
    );
  }

  if (isLoading || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-xl font-semibold" dir="ltr">
          {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} t={t} />
      </header>

      <section
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}
      >
        <div className="rounded-2xl border border-border bg-surface-raised p-5 text-sm">
          <h2 className="mb-2 font-medium">{t.checkout.contactInfo}</h2>
          <p>{order.fullName}</p>
          <p dir="ltr" className="text-text-secondary">
            {order.phoneNumber}
          </p>
          <p className="text-text-secondary">
            {order.addressLine1}, {order.city}
          </p>
          <p className="mt-1 text-xs text-text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5 text-sm">
          <h2 className="font-medium">{t.admin.actions}</h2>

          <Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
            <option value="">{t.admin.ordersView.updateStatus}…</option>
            <option value="processing">{t.statuses.order.processing}</option>
            <option value="shipped">{t.statuses.order.shipped}</option>
            <option value="delivered">{t.statuses.order.delivered}</option>
            <option value="cancelled">{t.statuses.order.cancelled}</option>
          </Select>
          <Button
            size="sm"
            disabled={statusDraft === "" || updateStatus.isPending}
            isLoading={updateStatus.isPending}
            onClick={() => changeStatus(statusDraft)}
          >
            {t.common.confirm}
          </Button>

          {order.paymentStatus === "pending" ? (
            <Button
              size="sm"
              variant="accent"
              isLoading={setPaymentStatus.isPending}
              onClick={() =>
                setPaymentStatus.mutate(
                  { id, paymentStatus: "collected" },
                  { onSuccess: () => pushToast(t.admin.ordersView.orderUpdated, "success") },
                )
              }
            >
              {t.admin.ordersView.markCollected}
            </Button>
          ) : (
            <Badge tone={order.paymentStatus === "collected" ? "success" : "neutral"}>
              {(t.statuses.payment as Record<string, string>)[order.paymentStatus] ?? order.paymentStatus}
            </Badge>
          )}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.productsView.name}</th>
              <th className="p-3 text-start font-medium">{t.common.quantity}</th>
              <th className="p-3 text-start font-medium">{t.admin.productsView.price}</th>
              <th className="p-3 text-end font-medium">{t.cart.subtotal}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-border first:border-t-0">
                <td className="max-w-48 truncate p-3">
                  {locale === "ar" ? item.productNameAr : item.productNameEn}
                </td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatCurrency(item.unitPrice, locale)}</td>
                <td className="p-3 text-end font-medium">{formatCurrency(item.lineTotal, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-1.5 border-t border-border p-5 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>{t.cart.subtotal}</span>
            <span>{formatCurrency(order.subtotal, locale)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>{t.cart.shipping}</span>
            <span>{formatCurrency(order.shippingFee, locale)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t.cart.total}</span>
            <span>{formatCurrency(order.total, locale)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
