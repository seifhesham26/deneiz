"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return trpc.banners.create.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
