"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetOrders(filters: {
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return trpc.orders.getAll.useQuery({
    status: filters.status,
    search: filters.search,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
  });
}
