"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Banknote, Check } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pushToast } from "@/components/ui/toast";
import { CartSummary } from "@/components/storefront/cart/cart-summary";
import { useCreateOrder } from "@/hooks/storefront/useCreateOrder";
import { createOrderInputSchema } from "@/server/orders/orders.validators";
import type { z } from "zod";
import { useCartStore } from "@/store/cart.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { useGetStoreSettings } from "@/hooks/admin/useGetStoreSettings";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";
import { calculateShipping } from "@/utils/calculate-shipping";
import { formatCurrency } from "@/utils/format-currency";
import { translateError, translateFieldMessage } from "@/lib/translate-error";

/** Server checkout schema minus items — those come from the cart store. */
const checkoutFormSchema = createOrderInputSchema.omit({ items: true });

type CheckoutFormOutput = z.output<typeof checkoutFormSchema>;

export function CheckoutForm() {
  const { locale, t } = useLang();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const createOrder = useCreateOrder();
  const isHydrated = useIsHydrated();
  const storeSettings = useGetStoreSettings();
  const { user } = useGetSessionUser();
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  const subtotal =
    Math.round(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  // Same function the server charges from — see utils/calculate-shipping.ts
  const shippingFee = storeSettings.data
    ? calculateShipping(subtotal, storeSettings.data)
    : null;
  const total = shippingFee === null ? null : Math.round((subtotal + shippingFee) * 100) / 100;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { paymentMethod: "cash_on_delivery" as const, email: user?.email ?? undefined },
  });

  function onSubmit(values: CheckoutFormOutput) {
    if (items.length === 0) return;

    createOrder.mutate(
      {
        ...values,
        locale,
        items: items.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          variantId: line.variantId,
          variantLabel: line.variantLabel,
        })),
      },
      {
        onSuccess: (order) => {
          clearCart();
          setPlacedOrderNumber(order.orderNumber);
        },
        onError: (error) => pushToast(translateError(error, t), "error"),
      },
    );
  }

  if (placedOrderNumber) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/15">
          <Check aria-hidden className="size-8 text-success" />
        </span>
        <h1 className="text-3xl font-semibold">{t.confirmation.title}</h1>
        <p className="max-w-md text-text-secondary">{t.confirmation.subtitle}</p>
        <p className="rounded-xl bg-surface px-6 py-3 text-sm">
          {t.confirmation.orderNumber}:{" "}
          <strong className="font-mono" dir="ltr">
            {placedOrderNumber}
          </strong>
        </p>
        {/* This screen is component state — a refresh loses it. A guest has no
            order history, so the number and the tracking page are the only way
            back to the order. */}
        <p className="max-w-md text-sm text-text-secondary">{t.confirmation.keepNumber}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push("/products")}>{t.confirmation.continueShopping}</Button>
          <Button variant="outline" onClick={() => router.push("/orders/lookup")}>
            {t.confirmation.trackOrder}
          </Button>
        </div>
      </div>
    );
  }

  if (isHydrated && items.length === 0 && !createOrder.isPending) {
    return (
      <div className="py-20 text-center text-text-secondary">{t.checkout.emptyCartWarning}</div>
    );
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row-reverse lg:gap-12">
      <div className="w-full lg:w-96">
        <CartSummary
          subtotal={subtotal}
          shippingFee={shippingFee}
          freeShippingThreshold={storeSettings.data?.freeShippingThreshold ?? null}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="text-3xl font-semibold">{t.checkout.title}</h1>

        <section className="flex flex-col gap-4 rounded-2xl border border-border p-5">
          <h2 className="font-medium">{t.checkout.contactInfo}</h2>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
          >
            <Input label={t.checkout.fullName} error={translateFieldMessage(errors.fullName?.message, t)} {...register("fullName")} />
            <Input
              label={t.checkout.phoneNumber}
              inputMode="tel"
              dir="ltr"
              error={translateFieldMessage(errors.phoneNumber?.message, t)}
              {...register("phoneNumber")}
            />
            <Input label={t.checkout.addressLine1} error={translateFieldMessage(errors.addressLine1?.message, t)} {...register("addressLine1")} />
            <Input label={t.checkout.city} error={translateFieldMessage(errors.city?.message, t)} {...register("city")} />
            <Input
              label={`${t.checkout.email} (${t.common.optional})`}
              type="email"
              inputMode="email"
              dir="ltr"
              error={translateFieldMessage(errors.email?.message, t)}
              {...register("email")}
            />
          </div>
          <Textarea label={t.checkout.notes} placeholder={t.checkout.notesPlaceholder} {...register("notes")} />
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border p-5">
          <h2 className="font-medium">{t.checkout.paymentMethod}</h2>
          {/* PROTOTYPE: COD is the only live method — card/wallet rails come later */}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-accent bg-accent/5 p-3">
            <input type="radio" value="cash_on_delivery" {...register("paymentMethod")} defaultChecked />
            <Banknote aria-hidden className="size-5 text-accent" />
            <span className="flex flex-col">
              <span className="text-sm font-medium">{t.checkout.codLabel}</span>
              <span className="text-xs text-text-secondary">{t.checkout.codDescription}</span>
            </span>
          </label>
        </section>

        <Button type="submit" size="lg" isLoading={createOrder.isPending || isSubmitting} disabled={items.length === 0 || total === null}>
          {t.checkout.placeOrder}
          {total === null ? "" : ` — ${formatCurrency(total, locale)}`}
        </Button>
      </form>
    </div>
  );
}
