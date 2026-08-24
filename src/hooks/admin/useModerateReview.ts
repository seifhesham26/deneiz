"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useModerateReview() {
  const queryClient = useQueryClient();
  return trpc.reviews.moderate.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useSetReviewFlagged() {
  const queryClient = useQueryClient();
  return trpc.reviews.setFlagged.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return trpc.reviews.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
