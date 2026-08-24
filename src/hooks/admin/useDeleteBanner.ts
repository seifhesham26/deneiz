"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return trpc.banners.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
