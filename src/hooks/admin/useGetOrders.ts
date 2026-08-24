"use client";

import { trpc } from "@/lib/trpc-client";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export function useGetOrders(filters: {
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  search?: string;
  page?: number;
}) {
  return trpc.orders.getAll.useQuery({
    status: filters.status,
    search: filters.search,
    page: filters.page ?? 1,
    pageSize: ADMIN_PAGE_SIZE,
  }, { placeholderData: (previous) => previous });
}
