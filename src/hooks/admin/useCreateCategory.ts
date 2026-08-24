"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return trpc.categories.create.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
