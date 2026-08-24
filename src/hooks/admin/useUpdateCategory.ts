"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return trpc.categories.update.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
