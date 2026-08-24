"use client";

import { trpc } from "@/lib/trpc-client";

export function useDeleteCategory() {
  const utils = trpc.useUtils();
  return trpc.categories.delete.useMutation({
    onSuccess: () => {
      void utils.categories.invalidate();
      void utils.products.invalidate();
    },
  });
}
