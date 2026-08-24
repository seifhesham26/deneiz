"use client";

import { trpc } from "@/lib/trpc-client";

export function useAdjustStock() {
  const utils = trpc.useUtils();
  return trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      void utils.inventory.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
