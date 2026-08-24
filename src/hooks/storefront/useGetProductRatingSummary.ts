"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetProductRatingSummary(productId: string | undefined) {
  return trpc.reviews.getRatingSummary.useQuery(
    { productId: productId ?? "" },
    { enabled: Boolean(productId) },
  );
}
