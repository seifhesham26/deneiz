"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return trpc.categories.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
