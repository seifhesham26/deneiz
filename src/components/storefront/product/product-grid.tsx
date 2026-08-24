"use client";

import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListRow } from "@/server/products/products.db";

interface ProductGridProps {
  products: ProductListRow[];
  isLoading?: boolean;
  skeletonCount?: number;
}

/** auto-fill grid — columns adapt continuously to any viewport width */
export function ProductGrid({ products, isLoading, skeletonCount = 8 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
