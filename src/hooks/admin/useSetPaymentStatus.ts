"use client";

import { trpc } from "@/lib/trpc-client";

export function useSetPaymentStatus() {
  const utils = trpc.useUtils();
  return trpc.orders.setPaymentStatus.useMutation({
    onSuccess: () => {
      void utils.orders.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
