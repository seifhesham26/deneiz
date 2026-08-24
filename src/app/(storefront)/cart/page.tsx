"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { CartItemRow } from "@/components/storefront/cart/cart-item";
import { CartSummary } from "@/components/storefront/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { useGetStoreSettings } from "@/hooks/admin/useGetStoreSettings";
import { calculateShipping } from "@/utils/calculate-shipping";

export default function CartPage() {
  const { t } = useLang();
  const items = useCartStore((state) => state.items);
  const isHydrated = useIsHydrated();
  const storeSettings = useGetStoreSettings();

  if (!isHydrated) {
    return <div className="content-shell section-y" aria-busy="true" />;
  }

  const subtotal =
    Math.round(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  // Shipping comes from the same settings row the server charges from, so the
  // total shown here can never disagree with the total on the order
  const shippingFee = storeSettings.data
    ? calculateShipping(subtotal, storeSettings.data)
    : null;

  return (
    <div className="content-shell section-y">
      <h1 className="mb-8 text-4xl font-semibold">{t.cart.title}</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <ShoppingBag aria-hidden className="size-14 text-text-muted" />
          <p className="text-text-secondary">{t.cart.empty}</p>
          <Link href="/products">
            <Button>{t.cart.emptyCta}</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row-reverse lg:gap-12">
          <div className="w-full lg:w-96">
            <CartSummary
              subtotal={subtotal}
              shippingFee={shippingFee}
              freeShippingThreshold={storeSettings.data?.freeShippingThreshold ?? null}
            />
          </div>

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
