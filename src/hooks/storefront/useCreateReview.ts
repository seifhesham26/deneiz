"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateReview() {
  const utils = trpc.useUtils();
  return trpc.reviews.create.useMutation({
    // A new review is pending moderation, so the public list will not change —
    // but the rating summary and the admin queue both should refetch
    onSuccess: () => {
      void utils.reviews.invalidate();
    },
  });
}
