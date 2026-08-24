"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useSetPaymentStatus() {
  const queryClient = useQueryClient();
  return trpc.orders.setPaymentStatus.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
