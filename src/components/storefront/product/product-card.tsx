"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { calculateDiscountPercent } from "@/utils/calculate-discount";
import { formatCurrency } from "@/utils/format-currency";
import { pushToast } from "@/components/ui/toast";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import type { ProductListRow } from "@/server/products/products.db";

interface ProductCardProps {
  product: ProductListRow;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useLang();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) =>
    state.entries.some((entry) => entry.productId === product.id),
  );

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const categoryName = locale === "ar" ? product.categoryNameAr : product.categoryNameEn;
  const discountPercent = calculateDiscountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stockQuantity <= 0;

  function handleAddToCart() {
    if (soldOut) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        unitPrice: product.price,
        imageUrl: product.coverImageUrl,
      },
      1,
    );
    pushToast(t.product.addedToCart, "success");
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-surface"
      >
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}

        {discountPercent ? (
          <span className="absolute start-3 top-3 rounded-full bg-danger px-2 py-1 text-xs font-semibold text-text-inverse">
            -{discountPercent}%
          </span>
        ) : null}

        <button
          type="button"
          aria-label={t.wishlist.title}
          onClick={(event) => {
            event.preventDefault();
            toggleWishlist({
              productId: product.id,
              slug: product.slug,
              nameEn: product.nameEn,
              nameAr: product.nameAr,
              imageUrl: product.coverImageUrl,
            });
          }}
          className="absolute end-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-raised/80"
        >
          <Heart
            aria-hidden
            className={`size-5 ${isInWishlist ? "fill-danger text-danger" : "text-text-secondary"}`}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {categoryName ? (
          <span className="text-xs text-text-muted">{categoryName}</span>
        ) : null}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-medium hover:text-accent">
          {name}
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{formatCurrency(product.price, locale)}</span>
            {product.compareAtPrice && discountPercent ? (
              <span className="text-xs text-text-muted line-through">
                {formatCurrency(product.compareAtPrice, locale)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={soldOut ? t.common.outOfStock : t.product.addToCart}
            disabled={soldOut}
            onClick={handleAddToCart}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity hover:bg-primary-hover disabled:opacity-40"
          >
            <ShoppingBag aria-hidden className="size-5" />
          </button>
        </div>

        {soldOut ? (
          <span className="text-xs text-danger">{t.common.outOfStock}</span>
        ) : product.stockQuantity <= 5 ? (
          <span className="text-xs text-warning">{t.common.lowStock}</span>
        ) : null}
      </div>
    </article>
  );
}
