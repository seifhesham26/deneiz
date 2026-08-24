"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetAdminReviews(filters: { status?: "pending" | "approved" | "rejected"; page?: number }) {
  return trpc.reviews.getAll.useQuery(
    { status: filters.status, page: filters.page ?? 1, pageSize: 20 },
    { placeholderData: (previous) => previous },
  );
}
