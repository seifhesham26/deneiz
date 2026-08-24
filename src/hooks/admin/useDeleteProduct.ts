"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return trpc.products.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
