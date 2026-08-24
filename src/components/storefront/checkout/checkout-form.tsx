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
import { DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { useCartStore } from "@/store/cart.store";

/** Server checkout schema minus items — those come from the cart store. */
const checkoutFormSchema = createOrderInputSchema.omit({ items: true });

type CheckoutFormOutput = z.output<typeof checkoutFormSchema>;

export function CheckoutForm() {
  const { locale, t } = useLang();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const createOrder = useCreateOrder();
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  const subtotal =
    Math.round(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { paymentMethod: "cash_on_delivery" as const },
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
        onError: (error) => pushToast(error.message || t.errors.generic, "error"),
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
        <Button onClick={() => router.push("/products")}>{t.confirmation.continueShopping}</Button>
      </div>
    );
  }

  if (items.length === 0 && !createOrder.isPending) {
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
          freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
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
            <Input label={t.checkout.fullName} error={errors.fullName?.message} {...register("fullName")} />
            <Input
              label={t.checkout.phoneNumber}
              inputMode="tel"
              dir="ltr"
              error={errors.phoneNumber?.message}
              {...register("phoneNumber")}
            />
            <Input label={t.checkout.addressLine1} error={errors.addressLine1?.message} {...register("addressLine1")} />
            <Input label={t.checkout.city} error={errors.city?.message} {...register("city")} />
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

        <Button type="submit" size="lg" isLoading={createOrder.isPending || isSubmitting} disabled={items.length === 0}>
          {t.checkout.placeOrder} — {total.toLocaleString(locale)}
        </Button>
      </form>
    </div>
  );
}
