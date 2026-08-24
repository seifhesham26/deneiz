"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return trpc.orders.create.useMutation({
    // Orders appear in "my orders" immediately after checkout
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
