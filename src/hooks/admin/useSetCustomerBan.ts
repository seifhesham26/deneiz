"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useSetCustomerBan() {
  const queryClient = useQueryClient();
  return trpc.customers.setBan.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
