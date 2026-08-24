"use client";

import { trpc } from "@/lib/trpc-client";
import { ADMIN_PAGE_SIZE, LOW_STOCK_DEFAULT_THRESHOLD } from "@/lib/constants";

export function useGetInventory(filters: {
  search?: string;
  page?: number;
}) {
  const settings = trpc.settings.getStoreSettings.useQuery();
  return trpc.inventory.getLevels.useQuery(
    {
      search: filters.search,
      threshold: settings.data?.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD,
      page: filters.page ?? 1,
      pageSize: ADMIN_PAGE_SIZE,
    },
    { placeholderData: (previous) => previous },
  );
}
