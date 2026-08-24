"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { ProductFiltersPanel } from "@/components/storefront/product/product-filters-panel";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories } from "@/hooks/storefront/useGetCategories";
import { useGetProducts } from "@/hooks/storefront/useGetProducts";
import { parseProductFilters, serializeProductFilters } from "@/utils/parse-filters";
import type { ProductFilters } from "@/server/products/products.validators";

function ProductsPageContent() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseProductFilters(searchParams);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data, isLoading, isFetching } = useGetProducts(filters);
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();

  const updateFilters = useCallback(
    (patch: Partial<ProductFilters>) => {
      const next = { ...filters, page: patch.page ?? 1, ...patch };
      const query = serializeProductFilters(next);
      router.replace(query ? `/products?${query}` : "/products", { scroll: false });
    },
    [filters, router],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / filters.pageSize)) : 1;
  const activeFilterCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0);

  return (
    <div className="content-shell section-y">
      <header className="mb-10 flex flex-col gap-2">
        <span className="eyebrow">{t.nav.categories}</span>
        <h1 className="text-4xl font-semibold sm:text-5xl">{t.nav.products}</h1>
        {data ? (
          <span className="text-sm text-text-secondary">{t.filters.resultsCount(data.total)}</span>
        ) : null}
      </header>

      {/* Mobile: filters live behind a button; Desktop: persistent rail */}
      <div className="mb-6 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setShowMobileFilters(true)}>
          <SlidersHorizontal aria-hidden className="size-4" />
          {t.filters.title}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <ProductFiltersPanel
              filters={filters}
              categories={categories ?? []}
              isCategoriesLoading={isCategoriesLoading}
              onChange={updateFilters}
              onReset={() => router.replace("/products", { scroll: false })}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <ProductGrid products={data?.items ?? []} isLoading={isLoading} skeletonCount={9} />

          {isLoading ? null : data && data.items.length === 0 ? (
            <p className="py-20 text-center text-text-secondary">{t.common.noResults}</p>
          ) : null}

          {totalPages > 1 ? (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="pagination">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => updateFilters({ page: pageNumber })}
                    aria-current={pageNumber === filters.page ? "page" : undefined}
                    className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm transition-colors ${
                      pageNumber === filters.page
                        ? "bg-primary font-semibold text-text-inverse"
                        : "hover:bg-surface"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </nav>
          ) : null}

          {isFetching && !isLoading ? (
            <div className="mt-6 flex justify-center" aria-hidden>
              <Skeleton className="h-1 w-24 rounded-full" />
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={showMobileFilters} onClose={() => setShowMobileFilters(false)} title={t.filters.title}>
        <ProductFiltersPanel
          filters={filters}
          categories={categories ?? []}
          isCategoriesLoading={isCategoriesLoading}
          onChange={(patch) => {
            updateFilters(patch);
          }}
          onReset={() => {
            router.replace("/products", { scroll: false });
          }}
        />
      </Modal>
    </div>
  );
}

export default function ProductsListingPage() {
  // Suspense boundary required because the content reads useSearchParams
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}
