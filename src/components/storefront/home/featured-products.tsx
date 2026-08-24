"use client";

import { useLang } from "@/components/providers/lang-provider";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { Reveal } from "@/components/storefront/reveal";
import { useGetProducts } from "@/hooks/storefront/useGetProducts";

export function FeaturedProducts() {
  const { t } = useLang();
  const { data, isLoading } = useGetProducts({ featuredOnly: true, page: 1, pageSize: 8, sort: "newest" });

  return (
    <section className="section-y">
      <div className="content-shell">
        <Reveal>
          <header className="mb-10 flex max-w-xl flex-col gap-2">
            <span className="eyebrow">{t.home.newArrivals}</span>
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.home.featuredTitle}</h2>
            <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
              {t.home.featuredSubtitle}
            </p>
          </header>
        </Reveal>

        <ProductGrid products={data?.items ?? []} isLoading={isLoading} skeletonCount={8} />
      </div>
    </section>
  );
}
