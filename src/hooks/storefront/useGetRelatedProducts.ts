"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetRelatedProducts(excludeId: string | undefined, categoryId?: string | null) {
  return trpc.products.getRelated.useQuery(
    { excludeId: excludeId ?? "", categoryId: categoryId ?? null },
    { enabled: Boolean(excludeId) },
  );
}
