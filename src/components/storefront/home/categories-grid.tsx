"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories } from "@/hooks/storefront/useGetCategories";

export function CategoriesGrid() {
  const { locale, t } = useLang();
  const { data: categories, isLoading } = useGetCategories();

  return (
    <section className="section-shell bg-surface">
      <div className="content-shell">
        <header className="mb-8 flex flex-col gap-1">
          <h2 className="text-3xl font-semibold">{t.home.categoriesTitle}</h2>
          <p className="text-sm text-text-secondary">{t.home.categoriesSubtitle}</p>
        </header>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
              ))
            : categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-raised"
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={locale === "ar" ? category.nameAr : category.nameEn}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span className="font-medium text-white">
                      {locale === "ar" ? category.nameAr : category.nameEn}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
