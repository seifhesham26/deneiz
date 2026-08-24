"use client";

import { trpc } from "@/lib/trpc-client";

export function useAssignProductToLocation() {
  const utils = trpc.useUtils();
  return trpc.warehouse.assignProduct.useMutation({
    onSuccess: () => {
      void utils.warehouse.invalidate();
    },
  });
}
