"use client";

import { trpc } from "@/lib/trpc-client";

export function useModerateReview() {
  const utils = trpc.useUtils();
  return trpc.reviews.moderate.useMutation({
    onSuccess: () => {
      void utils.reviews.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}

export function useSetReviewFlagged() {
  const utils = trpc.useUtils();
  return trpc.reviews.setFlagged.useMutation({
    onSuccess: () => {
      void utils.reviews.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}

export function useDeleteReview() {
  const utils = trpc.useUtils();
  return trpc.reviews.delete.useMutation({
    onSuccess: () => {
      void utils.reviews.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
