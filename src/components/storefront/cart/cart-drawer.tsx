"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { useCartStore, cartLineKey } from "@/store/cart.store";
import { useUiStore } from "@/store/ui.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";

export function CartDrawer() {
  const { locale, t } = useLang();
  const isOpen = useUiStore((state) => state.isCartDrawerOpen);
  const closeCartDrawer = useUiStore((state) => state.closeCartDrawer);
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const isHydrated = useIsHydrated();

  if (!isHydrated) return null;

  const subtotal =
    Math.round(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
          />
          <motion.aside
            role="dialog"
            aria-label={t.cart.title}
            className="fixed inset-y-0 end-0 z-50 flex w-[26rem] max-w-[92vw] flex-col bg-background"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShoppingBag aria-hidden className="size-5" />
                {t.cart.title}
              </h2>
              <button
                type="button"
                aria-label={t.common.close}
                onClick={closeCartDrawer}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <ShoppingBag aria-hidden className="size-12 text-text-muted" />
                <p className="text-text-secondary">{t.cart.empty}</p>
                <Button onClick={closeCartDrawer}>{t.cart.continueShopping}</Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-border overflow-y-auto">
                  {items.map((line) => {
                    const key = cartLineKey(line);
                    return (
                      <li key={key} className="flex gap-3 p-4">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={closeCartDrawer}
                        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface"
                      >
                        {line.imageUrl ? (
                          <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                        ) : null}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {locale === "ar" ? line.nameAr : line.nameEn}
                        </span>
                        {line.variantLabel ? (
                          <span className="text-xs text-text-muted">{line.variantLabel}</span>
                        ) : null}
                        <span className="text-sm">{line.unitPrice.toLocaleString(locale)}</span>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="decrease"
                              onClick={() => setQuantity(key, line.quantity - 1)}
                              className="flex min-h-9 min-w-9 items-center justify-center rounded-full hover:bg-surface"
                            >
                              <Minus aria-hidden className="size-4" />
                            </button>
                            <span className="w-8 text-center text-sm">{line.quantity}</span>
                            <button
                              type="button"
                              aria-label="increase"
                              onClick={() => setQuantity(key, line.quantity + 1)}
                              className="flex min-h-9 min-w-9 items-center justify-center rounded-full hover:bg-surface"
                            >
                              <Plus aria-hidden className="size-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label={t.common.remove}
                            onClick={() => removeItem(key)}
                            className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-text-muted hover:text-danger"
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>

                <div className="border-t border-border p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{t.cart.subtotal}</span>
                    <span className="font-semibold">{subtotal.toLocaleString(locale)}</span>
                  </div>
                  <Link href="/checkout" onClick={closeCartDrawer} className="block">
                    <Button className="w-full">{t.cart.checkout}</Button>
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
