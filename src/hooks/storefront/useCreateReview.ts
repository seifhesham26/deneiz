"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateReview() {
  return trpc.reviews.create.useMutation();
}
