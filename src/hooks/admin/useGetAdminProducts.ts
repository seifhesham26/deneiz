"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetAdminProducts(filters: { search?: string; page?: number }) {
  return trpc.products.listAdmin.useQuery(
    {
      search: filters.search,
      page: filters.page ?? 1,
      pageSize: 20,
    },
    { placeholderData: (previous) => previous },
  );
}
