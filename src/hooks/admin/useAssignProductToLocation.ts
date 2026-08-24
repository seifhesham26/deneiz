"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useAssignProductToLocation() {
  const queryClient = useQueryClient();
  return trpc.warehouse.assignProduct.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
