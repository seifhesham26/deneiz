"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
