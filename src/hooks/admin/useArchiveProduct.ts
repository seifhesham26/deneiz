"use client";

import { trpc } from "@/lib/trpc-client";

export function useArchiveProduct() {
  const utils = trpc.useUtils();
  return trpc.products.archive.useMutation({
    onSuccess: () => {
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    },
  });
}
