"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetInventory(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const settings = trpc.settings.getStoreSettings.useQuery();
  return trpc.inventory.getLevels.useQuery(
    {
      search: filters.search,
      threshold: settings.data?.lowStockThreshold ?? 5,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
    { placeholderData: (previous) => previous },
  );
}
