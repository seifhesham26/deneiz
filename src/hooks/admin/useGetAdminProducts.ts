"use client";

import { trpc } from "@/lib/trpc-client";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export function useGetAdminProducts(filters: { search?: string; page?: number }) {
  return trpc.products.listAdmin.useQuery(
    {
      search: filters.search,
      page: filters.page ?? 1,
      pageSize: ADMIN_PAGE_SIZE,
    },
    { placeholderData: (previous) => previous },
  );
}
