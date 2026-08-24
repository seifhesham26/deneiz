"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateWarehouseLocation() {
  const queryClient = useQueryClient();
  return trpc.warehouse.createLocation.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
