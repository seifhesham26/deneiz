"use client";

import { ShoppingBag } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { CartItemRow } from "@/components/storefront/cart/cart-item";
import { CartSummary } from "@/components/storefront/cart/cart-summary";
import { useCartStore } from "@/store/cart.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export default function CartPage() {
  const { t } = useLang();
  const items = useCartStore((state) => state.items);
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <div className="content-shell section-y" aria-busy="true" />;
  }

  const subtotal =
    Math.round(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;

  return (
    <div className="content-shell section-y">
      <h1 className="mb-8 text-4xl font-semibold">{t.cart.title}</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <ShoppingBag aria-hidden className="size-14 text-text-muted" />
          <p className="text-text-secondary">{t.cart.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row-reverse lg:gap-12">
          <div className="w-full lg:w-96">
            <CartSummary
              subtotal={subtotal}
              shippingFee={shippingFee}
              freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
            />
          </div>

          {/* PROTOTYPE: shipping/threshold values are constants until the settings module is wired into the storefront */}
          <ul className="min-w-0 flex-1 divide-y divide-border border-t border-border">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
