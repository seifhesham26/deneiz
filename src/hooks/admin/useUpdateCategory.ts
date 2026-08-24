"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateCategory() {
  const utils = trpc.useUtils();
  return trpc.categories.update.useMutation({
    onSuccess: () => {
      void utils.categories.invalidate();
      void utils.products.invalidate();
    },
  });
}
