"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";

export default function WishlistPage() {
  const { locale, t } = useLang();
  const entries = useWishlistStore((state) => state.entries);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const isHydrated = useIsHydrated();

  if (!isHydrated) return <div className="content-shell section-shell" aria-busy="true" />;

  return (
    <div className="content-shell section-shell">
      <h1 className="mb-8 text-4xl font-semibold">{t.wishlist.title}</h1>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Heart aria-hidden className="size-14 text-text-muted" />
          <p className="text-text-secondary">{t.wishlist.empty}</p>
          <Link href="/products">
            <Button>{t.wishlist.emptyCta}</Button>
          </Link>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}
        >
          {entries.map((entry) => (
            <article
              key={entry.productId}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised"
            >
              <Link href={`/products/${entry.slug}`} className="relative aspect-[4/5] bg-surface">
                {entry.imageUrl ? (
                  <Image
                    src={entry.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <Link href={`/products/${entry.slug}`} className="line-clamp-2 font-medium hover:text-accent">
                  {locale === "ar" ? entry.nameAr : entry.nameEn}
                </Link>

                <div className="mt-auto flex gap-2">
                  {/* Price lives on the product record — route there so the cart gets a real unit price */}
                  <Link href={`/products/${entry.slug}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <ShoppingBag aria-hidden className="size-4" />
                      {t.wishlist.moveToCart}
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => removeFromWishlist(entry.productId)}>
                    {t.common.remove}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
