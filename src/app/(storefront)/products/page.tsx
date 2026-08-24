"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
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
        <span className="eyebrow">{t.shop.eyebrow}</span>
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
            <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="pagination">
              <PaginationArrow
                direction="start"
                label={t.common.previous}
                disabled={filters.page <= 1}
                onClick={() => updateFilters({ page: filters.page - 1 })}
              />
              {buildPageWindow(filters.page, totalPages).map((entry, index) =>
                typeof entry === "number" ? (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => updateFilters({ page: entry })}
                    aria-current={entry === filters.page ? "page" : undefined}
                    aria-label={t.common.pageLabel(entry)}
                    className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm transition-colors ${
                      entry === filters.page
                        ? "bg-primary font-semibold text-text-inverse"
                        : "hover:bg-surface"
                    }`}
                  >
                    {entry}
                  </button>
                ) : (
                  <span key={`gap-${index}`} className="px-1.5 text-text-muted" aria-hidden>
                    …
                  </span>
                ),
              )}
              <PaginationArrow
                direction="end"
                label={t.common.next}
                disabled={filters.page >= totalPages}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              />
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

/** Page numbers around the current page, with ellipsis gaps for far ranges. */
function buildPageWindow(current: number, total: number): (number | "gap")[] {
  // Short ranges always render every page — an ellipsis would only hide one
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const desired = new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter(
      (page) => page >= 1 && page <= total,
    ),
  );

  if (desired.size >= total) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const sorted = [...desired].sort((a, b) => a - b);
  const pages: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) pages.push("gap");
    pages.push(page);
    previous = page;
  }
  return pages;
}

function PaginationArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "start" | "end";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
    >
      {/* Chevrons are direction-biased; mirror them under RTL */}
      <Icon aria-hidden className="size-4.5 rtl:rotate-180" />
    </button>
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
