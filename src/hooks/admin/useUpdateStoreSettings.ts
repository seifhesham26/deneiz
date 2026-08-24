"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateStoreSettings() {
  const utils = trpc.useUtils();
  return trpc.settings.updateSettings.useMutation({
    onSuccess: () => {
      void utils.settings.invalidate();
    },
  });
}
