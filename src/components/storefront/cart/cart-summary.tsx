"use client";

import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";
import { useCartStore } from "@/store/cart.store";

interface CartSummaryProps {
  subtotal: number;
  /** null while the store settings query is still resolving */
  shippingFee: number | null;
  freeShippingThreshold: number | null;
}

export function CartSummary({ subtotal, shippingFee, freeShippingThreshold }: CartSummaryProps) {
  const { locale, t } = useLang();
  const itemCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));

  const total = shippingFee === null ? null : subtotal + shippingFee;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="text-lg font-semibold">{t.checkout.orderSummary}</h2>

      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{t.cart.itemsCount(itemCount)}</span>
        <span>{formatCurrency(subtotal, locale)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{t.cart.shipping}</span>
        <span>
          {shippingFee === null
            ? "—"
            : shippingFee === 0
              ? t.cart.freeShipping
              : formatCurrency(shippingFee, locale)}
        </span>
      </div>

      {freeShippingThreshold !== null && subtotal > 0 && subtotal < freeShippingThreshold ? (
        <p className="rounded-lg bg-accent/10 p-3 text-xs text-accent">
          {t.cart.freeShippingHint(Math.round(freeShippingThreshold - subtotal))}
        </p>
      ) : null}

      <div className="flex justify-between border-t border-border pt-3 font-semibold">
        <span>{t.cart.total}</span>
        <span>{total === null ? "—" : formatCurrency(total, locale)}</span>
      </div>

      <Link href="/checkout">
        <Button className="w-full" disabled={itemCount === 0}>
          {t.cart.checkout}
        </Button>
      </Link>

      <Link href="/products" className="text-center text-xs text-text-secondary hover:text-text-primary">
        {t.cart.continueShopping}
      </Link>
    </div>
  );
}
