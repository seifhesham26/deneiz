"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
