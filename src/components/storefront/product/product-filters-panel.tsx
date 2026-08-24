"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProductFilters, ProductSortValue } from "@/server/products/products.validators";
import type { CategoryRecord } from "@/types/api";

interface ProductFiltersPanelProps {
  filters: ProductFilters;
  categories: CategoryRecord[];
  isCategoriesLoading: boolean;
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
}

export function ProductFiltersPanel({
  filters,
  categories,
  isCategoriesLoading,
  onChange,
  onReset,
}: ProductFiltersPanelProps) {
  const { locale, t } = useLang();

  function handlePriceApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const minRaw = String(formData.get("minPrice") ?? "").trim();
    const maxRaw = String(formData.get("maxPrice") ?? "").trim();
    onChange({
      minPrice: minRaw === "" ? undefined : Number(minRaw),
      maxPrice: maxRaw === "" ? undefined : Number(maxRaw),
    });
  }

  const sortOptions: { value: ProductSortValue; label: string }[] = [
    { value: "newest", label: t.filters.newest },
    { value: "price_asc", label: t.filters.priceLowHigh },
    { value: "price_desc", label: t.filters.priceHighLow },
    { value: "top_rated", label: t.filters.topRated },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-64" aria-label={t.filters.title}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <SlidersHorizontal aria-hidden className="size-5" />
          {t.filters.title}
        </h2>
        {filters.search || filters.categorySlug || filters.minPrice !== undefined || filters.maxPrice !== undefined ? (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-11 items-center gap-1 px-2 text-xs text-text-secondary hover:text-danger"
          >
            <X aria-hidden className="size-4" />
            {t.filters.clearAll}
          </button>
        ) : null}
      </div>

      <Select
        label={t.filters.sortBy}
        value={filters.sort}
        onChange={(event) => onChange({ sort: event.target.value as ProductSortValue })}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-text-secondary">{t.filters.category}</span>
        {isCategoriesLoading ? null : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ categorySlug: undefined })}
              aria-pressed={!filters.categorySlug}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                !filters.categorySlug
                  ? "border-accent bg-accent/10 font-medium"
                  : "border-border hover:bg-surface"
              }`}
            >
              {t.filters.allCategories}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  onChange({
                    categorySlug: category.slug === filters.categorySlug ? undefined : category.slug,
                  })
                }
                aria-pressed={filters.categorySlug === category.slug}
                className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                  filters.categorySlug === category.slug
                    ? "border-accent bg-accent/10 font-medium"
                    : "border-border hover:bg-surface"
                }`}
              >
                {locale === "ar" ? category.nameAr : category.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyed by current bounds so URL navigation resets the inputs */}
      <form
        key={`${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}`}
        onSubmit={handlePriceApply}
        className="flex flex-col gap-2"
      >
        <span className="text-xs font-medium text-text-secondary">{t.filters.priceRange}</span>
        <div className="flex items-center gap-2">
          <Input
            name="minPrice"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t.filters.minPrice}
            defaultValue={filters.minPrice?.toString() ?? ""}
          />
          <span className="text-text-muted">–</span>
          <Input
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t.filters.maxPrice}
            defaultValue={filters.maxPrice?.toString() ?? ""}
          />
        </div>
        <Button size="sm" variant="outline" type="submit">
          {t.common.apply}
        </Button>
      </form>
    </aside>
  );
}
