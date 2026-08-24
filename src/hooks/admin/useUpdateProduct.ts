"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateProduct() {
  const utils = trpc.useUtils();
  return trpc.products.update.useMutation({
    onSuccess: () => {
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
