"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toast";
import { ReviewList } from "@/components/storefront/reviews/review-list";
import { ProductImages } from "./product-images";
import { VariantPicker } from "./variant-picker";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { calculateDiscountPercent } from "@/utils/calculate-discount";
import { formatCurrency } from "@/utils/format-currency";
import type { ProductDetail } from "@/types/api";

interface ProductDetailViewProps {
  product: ProductDetail;
}

function buildVariantLabel(variant: {
  size: string | null;
  color: string | null;
  material: string | null;
}): string | undefined {
  const parts = [variant.size, variant.color, variant.material].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { locale, t } = useLang();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) =>
    state.entries.some((entry) => entry.productId === product.id),
  );

  const firstAvailable = useMemo(
    () => product.variants.find((variant) => variant.stockQuantity > 0) ?? null,
    [product.variants],
  );
  const [selectedVariant, setSelectedVariant] = useState(firstAvailable);
  const [quantity, setQuantity] = useState(1);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
  const categoryName = locale === "ar" ? product.categoryNameAr : product.categoryNameEn;
  const discountPercent = calculateDiscountPercent(product.price, product.compareAtPrice);

  // With variants, the selected row owns price+stock; without, the product does
  const effectivePrice = selectedVariant
    ? Math.round((product.price + selectedVariant.priceDelta) * 100) / 100
    : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const soldOut = effectiveStock <= 0;

  function handleAddToCart() {
    if (soldOut) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        unitPrice: effectivePrice,
        imageUrl: product.images[0]?.url ?? null,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant ? buildVariantLabel(selectedVariant) : undefined,
      },
      quantity,
    );
    pushToast(t.product.addedToCart, "success");
  }

  return (
    <div className="content-shell section-y flex flex-col gap-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14 xl:gap-20">
        <ProductImages images={product.images} productName={name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-5">
            {/* Breadcrumb keeps context without taking the user off-page */}
            <nav aria-label="breadcrumb" className="text-xs text-text-muted">
              <Link href="/" className="hover:text-text-secondary">
                {t.nav.home}
              </Link>
              <span aria-hidden> / </span>
              <Link href="/products" className="hover:text-text-secondary">
                {t.nav.products}
              </Link>
              {categoryName ? (
                <>
                  <span aria-hidden> / </span>
                  <Link
                    href={`/products?category=${product.categorySlug}`}
                    className="hover:text-text-secondary"
                  >
                    {categoryName}
                  </Link>
                </>
              ) : null}
            </nav>

            <h1 className="text-3xl font-semibold sm:text-4xl">{name}</h1>

            <div className="flex flex-wrap items-center gap-3">
              {product.avgRating != null && (product.reviewCount ?? 0) > 0 ? (
                <span className="flex items-center gap-1 text-sm">
                  <Star aria-hidden className="size-4 fill-accent text-accent" />
                  {product.avgRating}
                  <span className="text-text-muted">
                    ({t.product.reviewsCount(product.reviewCount ?? 0)})
                  </span>
                </span>
              ) : null}
              {soldOut ? (
                <Badge tone="danger">{t.common.outOfStock}</Badge>
              ) : effectiveStock <= 5 ? (
                <Badge tone="warning">{t.common.lowStock}</Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatCurrency(effectivePrice, locale)}</span>
              {product.compareAtPrice && discountPercent ? (
                <>
                  <span className="text-sm text-text-muted line-through">
                    {formatCurrency(product.compareAtPrice, locale)}
                  </span>
                  <Badge tone="danger">
                    {t.product.save} {discountPercent}%
                  </Badge>
                </>
              ) : null}
            </div>

            {description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {description}
              </p>
            ) : null}

            {product.variants.length > 0 ? (
              <VariantPicker
                variants={product.variants}
                selected={selectedVariant}
                onSelect={(variant) => {
                  setSelectedVariant(variant);
                  setQuantity(1);
                }}
              />
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  aria-label="decrease"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex min-h-11 min-w-11 items-center justify-center"
                >
                  <Minus aria-hidden className="size-4" />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  aria-label="increase"
                  onClick={() => setQuantity((value) => Math.min(effectiveStock || 1, value + 1))}
                  disabled={soldOut}
                  className="flex min-h-11 min-w-11 items-center justify-center disabled:opacity-40"
                >
                  <Plus aria-hidden className="size-4" />
                </button>
              </div>

              <Button onClick={handleAddToCart} disabled={soldOut}>
                <ShoppingBag aria-hidden className="size-5" />
                {soldOut ? t.common.outOfStock : t.product.addToCart}
              </Button>

              <button
                type="button"
                aria-label={t.wishlist.title}
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    slug: product.slug,
                    nameEn: product.nameEn,
                    nameAr: product.nameAr,
                    imageUrl: product.images[0]?.url ?? null,
                  })
                }
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface"
              >
                <Heart
                  aria-hidden
                  className={`size-5 transition-transform active:scale-90 ${
                    isInWishlist ? "fill-danger text-danger" : "text-text-secondary"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReviewList productId={product.id} />
    </div>
  );
}
