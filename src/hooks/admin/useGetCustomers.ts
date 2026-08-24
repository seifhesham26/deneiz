"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetCustomers(filters: { search?: string; page?: number }) {
  return trpc.customers.getAll.useQuery(
    { search: filters.search, page: filters.page ?? 1, pageSize: 20 },
    { placeholderData: (previous) => previous },
  );
}

export function useGetCustomerDetail(id: string | undefined) {
  return trpc.customers.getById.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );
}
