"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return trpc.settings.updateSettings.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
