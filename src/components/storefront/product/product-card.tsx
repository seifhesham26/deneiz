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
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { useGetStoreSettings } from "@/hooks/admin/useGetStoreSettings";
import { LOW_STOCK_DEFAULT_THRESHOLD } from "@/lib/constants";
import type { ProductListRow } from "@/server/products/products.db";

interface ProductCardProps {
  product: ProductListRow;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useLang();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isHydrated = useIsHydrated();
  const storeSettings = useGetStoreSettings();
  const isInWishlist = useWishlistStore((state) =>
    state.entries.some((entry) => entry.productId === product.id),
  );
  // The persisted store rehydrates after SSR — showing the true state before
  // then would mismatch the server-rendered (always empty) wishlist
  const showWishlisted = isHydrated && isInWishlist;

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const categoryName = locale === "ar" ? product.categoryNameAr : product.categoryNameEn;
  const discountPercent = calculateDiscountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stockQuantity <= 0;
  const lowStockThreshold =
    storeSettings.data?.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD;

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        aria-label={name}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-surface"
      >
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-text-muted">
            <ShoppingBag aria-hidden className="size-10" />
          </span>
        )}

        {discountPercent ? (
          <span className="absolute start-3 top-3 rounded-full bg-danger px-2 py-1 text-xs font-semibold text-text-inverse">
            -{discountPercent}%
          </span>
        ) : null}
      </Link>

      {/* Sibling of the link, not a child: nesting interactive elements is
          invalid HTML and makes keyboard activation ambiguous */}
      <button
        type="button"
        aria-label={showWishlisted ? t.wishlist.remove : t.wishlist.add}
        aria-pressed={showWishlisted}
        onClick={() =>
          toggleWishlist({
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            imageUrl: product.coverImageUrl,
          })
        }
        className="absolute end-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-raised/80"
      >
        <Heart
          aria-hidden
          className={`size-5 ${showWishlisted ? "fill-danger text-danger" : "text-text-secondary"}`}
        />
      </button>

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

          {product.hasVariants ? (
            // Adding from the grid would create a variantless line at the base
            // price — a second, differently-keyed line for the same product
            <Link
              href={`/products/${product.slug}`}
              aria-label={t.product.selectVariant}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity hover:bg-primary-hover"
            >
              <ShoppingBag aria-hidden className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              aria-label={soldOut ? t.common.outOfStock : t.product.addToCart}
              disabled={soldOut}
              onClick={handleAddToCart}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity hover:bg-primary-hover disabled:opacity-40"
            >
              <ShoppingBag aria-hidden className="size-5" />
            </button>
          )}
        </div>

        {soldOut ? (
          <span className="text-xs text-danger">{t.common.outOfStock}</span>
        ) : product.stockQuantity <= lowStockThreshold ? (
          <span className="text-xs text-warning">{t.common.lowStock}</span>
        ) : null}
      </div>
    </article>
  );
}
