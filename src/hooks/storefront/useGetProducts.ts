"use client";

import { trpc } from "@/lib/trpc-client";
import type { ProductFilters } from "@/server/products/products.validators";

export function useGetProducts(filters: ProductFilters) {
  return trpc.products.getAll.useQuery(filters);
}
