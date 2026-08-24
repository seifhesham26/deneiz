"use client";

import { useLang } from "@/components/providers/lang-provider";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { useGetProducts } from "@/hooks/storefront/useGetProducts";

export function FeaturedProducts() {
  const { t } = useLang();
  const { data, isLoading } = useGetProducts({ featuredOnly: true, page: 1, pageSize: 8, sort: "newest" });

  return (
    <section className="section-shell">
      <div className="content-shell">
        <header className="mb-8 flex flex-col gap-1">
          <h2 className="text-3xl font-semibold">{t.home.featuredTitle}</h2>
          <p className="text-sm text-text-secondary">{t.home.featuredSubtitle}</p>
        </header>

        <ProductGrid products={data?.items ?? []} isLoading={isLoading} />
      </div>
    </section>
  );
}
