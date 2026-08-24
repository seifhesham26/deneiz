"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateCategory() {
  const utils = trpc.useUtils();
  return trpc.categories.create.useMutation({
    onSuccess: () => {
      void utils.categories.invalidate();
      void utils.products.invalidate();
    },
  });
}
