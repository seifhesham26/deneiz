"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateWarehouseLocation() {
  const utils = trpc.useUtils();
  return trpc.warehouse.createLocation.useMutation({
    onSuccess: () => {
      void utils.warehouse.invalidate();
    },
  });
}
