"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return trpc.products.update.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
