"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetProductReviews(productId: string | undefined, page = 1) {
  return trpc.reviews.getProductReviews.useQuery(
    { productId: productId ?? "", page },
    { enabled: Boolean(productId) },
  );
}
