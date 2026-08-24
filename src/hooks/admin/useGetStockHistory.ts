"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetStockHistory(productId: string | undefined) {
  return trpc.inventory.getHistory.useQuery(
    { productId: productId ?? "", limit: 20 },
    { enabled: Boolean(productId) },
  );
}
