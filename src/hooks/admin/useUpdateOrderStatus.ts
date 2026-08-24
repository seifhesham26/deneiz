"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateOrderStatus() {
  const utils = trpc.useUtils();
  return trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      void utils.orders.invalidate();
      void utils.inventory.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
