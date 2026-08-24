"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";
import { useCartStore, type CartItem } from "@/store/cart.store";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { locale, t } = useLang();
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/products/${item.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill sizes="96px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.slug}`} className="truncate font-medium hover:text-accent">
            {locale === "ar" ? item.nameAr : item.nameEn}
          </Link>
          <button
            type="button"
            aria-label={t.common.remove}
            onClick={() => removeItem(item.productId)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-muted hover:text-danger"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>

        <span className="text-sm text-text-secondary">{formatCurrency(item.unitPrice, locale)}</span>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-full border border-border">
            <button
              type="button"
              aria-label="decrease"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <Minus aria-hidden className="size-4" />
            </button>
            <span className="w-10 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              aria-label="increase"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <Plus aria-hidden className="size-4" />
            </button>
          </div>

          <span className="font-semibold">
            {formatCurrency(Math.round(item.unitPrice * item.quantity * 100) / 100, locale)}
          </span>
        </div>
      </div>
    </li>
  );
}
