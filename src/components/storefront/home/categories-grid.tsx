"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/storefront/reveal";
import { useGetCategories } from "@/hooks/storefront/useGetCategories";

export function CategoriesGrid() {
  const { locale, t } = useLang();
  const { data: categories, isLoading } = useGetCategories();

  return (
    <section className="section-y bg-surface">
      <div className="content-shell">
        <Reveal>
          <header className="mb-10 flex max-w-xl flex-col gap-2">
            <span className="eyebrow">{t.nav.categories}</span>
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.home.categoriesTitle}</h2>
            <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
              {t.home.categoriesSubtitle}
            </p>
          </header>
        </Reveal>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] w-full" />
              ))
            : categories?.map((category, index) => (
                <Reveal key={category.id} delay={index * 0.06}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-surface-raised"
                  >
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={locale === "ar" ? category.nameAr : category.nameEn}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5 pt-14">
                      <span className="block font-medium text-white">
                        {locale === "ar" ? category.nameAr : category.nameEn}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/70">
                        {t.home.shopNow} →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
