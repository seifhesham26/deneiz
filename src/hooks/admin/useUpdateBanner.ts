"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return trpc.banners.update.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
