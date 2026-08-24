"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateOrder() {
  const utils = trpc.useUtils();
  return trpc.orders.create.useMutation({
    // Orders appear in "my orders" immediately after checkout
    onSuccess: () => {
      void utils.orders.invalidate();
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
