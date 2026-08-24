"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearch } from "lucide-react";
import type { z } from "zod";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { useLookupOrder } from "@/hooks/storefront/useLookupOrder";
import { orderLookupInputSchema } from "@/server/orders/orders.validators";
import { translateError, translateFieldMessage } from "@/lib/translate-error";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

type OrderLookupValues = z.input<typeof orderLookupInputSchema>;

/**
 * Guest orders have no account to hang off, so this is the only way a customer
 * who checked out as a guest can see their order again after closing the
 * confirmation screen.
 */
export default function OrderLookupPage() {
  const { locale, t } = useLang();
  const lookup = useLookupOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderLookupValues>({
    resolver: zodResolver(orderLookupInputSchema),
    defaultValues: { orderNumber: "", phoneNumber: "" },
  });

  const order = lookup.data;

  return (
    <div className="content-shell section-y">
      <h1 className="text-4xl font-semibold">{t.orderLookup.title}</h1>
      <p className="mt-2 max-w-prose text-text-secondary">{t.orderLookup.subtitle}</p>

      <form
        noValidate
        onSubmit={handleSubmit((values) => lookup.mutate(values))}
        className="mt-8 flex max-w-xl flex-col gap-4"
      >
        <Input
          label={t.orderLookup.orderNumberLabel}
          placeholder={t.orderLookup.orderNumberPlaceholder}
          dir="ltr"
          autoComplete="off"
          error={translateFieldMessage(errors.orderNumber?.message, t)}
          {...register("orderNumber")}
        />
        <Input
          label={t.orderLookup.phoneLabel}
          type="tel"
          dir="ltr"
          autoComplete="tel"
          error={translateFieldMessage(errors.phoneNumber?.message, t)}
          {...register("phoneNumber")}
        />

        <div>
          <Button type="submit" disabled={lookup.isPending}>
            {lookup.isPending ? t.orderLookup.searching : t.orderLookup.submit}
          </Button>
        </div>

        {lookup.error ? (
          <p role="alert" className="text-sm text-danger">
            {translateError(lookup.error, t)}
          </p>
        ) : null}
      </form>

      {order ? (
        <section className="mt-10 max-w-xl rounded-2xl border border-border bg-surface-raised p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-sm" dir="ltr">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} t={t} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-text-secondary">{t.orderLookup.placedOn}</dt>
            <dd className="text-end">{formatDate(order.createdAt, locale)}</dd>
            <dt className="text-text-secondary">{t.orderLookup.total}</dt>
            <dd className="text-end font-semibold">{formatCurrency(order.total, locale)}</dd>
          </dl>

          <h2 className="mt-6 mb-3 text-sm font-semibold">{t.orderLookup.items}</h2>
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <PackageSearch aria-hidden className="m-4 size-6 text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {locale === "ar" ? item.productNameAr : item.productNameEn}
                  </p>
                  {item.variantLabel ? (
                    <p className="text-xs text-text-muted">{item.variantLabel}</p>
                  ) : null}
                </div>
                <span className="text-xs text-text-secondary">×{item.quantity}</span>
                <span className="text-sm">{formatCurrency(item.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
