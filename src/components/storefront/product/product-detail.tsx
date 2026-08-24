"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toast";
import { ReviewList } from "@/components/storefront/reviews/review-list";
import { ProductImages } from "./product-images";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { calculateDiscountPercent } from "@/utils/calculate-discount";
import { formatCurrency } from "@/utils/format-currency";
import type { ProductDetail } from "@/types/api";

interface ProductDetailViewProps {
  product: ProductDetail;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { locale, t } = useLang();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) =>
    state.entries.some((entry) => entry.productId === product.id),
  );
  const [quantity, setQuantity] = useState(1);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
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
        imageUrl: product.images[0]?.url ?? null,
      },
      quantity,
    );
    pushToast(t.product.addedToCart, "success");
  }

  return (
    <div className="content-shell section-shell flex flex-col gap-14">
      <div
        className="grid gap-8"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}
      >
        <ProductImages images={product.images} productName={name} />

        <div className="flex flex-col gap-4">
          {categoryName ? (
            <Link href="/products" className="text-sm text-accent hover:underline">
              {categoryName}
            </Link>
          ) : null}

          <h1 className="text-3xl font-semibold">{name}</h1>

          <div className="flex items-center gap-3">
            {product.avgRating != null && (product.reviewCount ?? 0) > 0 ? (
              <span className="flex items-center gap-1 text-sm">
                <Star aria-hidden className="size-4 fill-accent text-accent" />
                {product.avgRating}
                <span className="text-text-muted">({t.product.reviewsCount(product.reviewCount ?? 0)})</span>
              </span>
            ) : null}
            {soldOut ? (
              <Badge tone="danger">{t.common.outOfStock}</Badge>
            ) : product.stockQuantity <= 5 ? (
              <Badge tone="warning">{t.common.lowStock}</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold" style={{ fontSize: "var(--text-2xl)" }}>
              {formatCurrency(product.price, locale)}
            </span>
            {product.compareAtPrice && discountPercent ? (
              <>
                <span className="text-text-muted line-through">
                  {formatCurrency(product.compareAtPrice, locale)}
                </span>
                <Badge tone="danger">
                  {t.product.save} {discountPercent}%
                </Badge>
              </>
            ) : null}
          </div>

          {description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{description}</p>
          ) : null}

          {product.variants.length > 0 ? (
            <div className="rounded-xl border border-border p-4 text-sm text-text-secondary">
              {/* PROTOTYPE: variant picker UI lands with the size/color matrix task */}
              {product.variants.length} {t.admin.productsView.variants.toLowerCase()}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
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
                onClick={() => setQuantity((value) => Math.min(product.stockQuantity || 1, value + 1))}
                className="flex min-h-11 min-w-11 items-center justify-center"
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </div>

            <Button onClick={handleAddToCart} disabled={soldOut} isLoading={false}>
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
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border hover:bg-surface"
            >
              <Heart
                aria-hidden
                className={`size-5 ${isInWishlist ? "fill-danger text-danger" : "text-text-secondary"}`}
              />
            </button>
          </div>
        </div>
      </div>

      <ReviewList productId={product.id} />
    </div>
  );
}
