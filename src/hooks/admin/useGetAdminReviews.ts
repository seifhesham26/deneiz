"use client";

import { trpc } from "@/lib/trpc-client";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export function useGetAdminReviews(filters: { status?: "pending" | "approved" | "rejected"; page?: number }) {
  return trpc.reviews.getAll.useQuery(
    { status: filters.status, page: filters.page ?? 1, pageSize: ADMIN_PAGE_SIZE },
    { placeholderData: (previous) => previous },
  );
}
