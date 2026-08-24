"use client";

import { trpc } from "@/lib/trpc-client";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export function useGetCustomers(filters: { search?: string; page?: number }) {
  return trpc.customers.getAll.useQuery(
    { search: filters.search, page: filters.page ?? 1, pageSize: ADMIN_PAGE_SIZE },
    { placeholderData: (previous) => previous },
  );
}

export function useGetCustomerDetail(id: string | undefined) {
  return trpc.customers.getById.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );
}
