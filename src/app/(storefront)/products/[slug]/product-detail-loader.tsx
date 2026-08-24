"use client";

import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/storefront/product/product-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProductBySlug } from "@/hooks/storefront/useGetProductBySlug";

export function ProductDetailLoader({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useGetProductBySlug(slug);

  if (isLoading) {
    return (
      <div className="content-shell section-shell grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    // Unknown slug renders the shared 404 UI
    notFound();
  }

  return <ProductDetailView product={data} />;
}
