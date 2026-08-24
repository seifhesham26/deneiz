"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateBanner() {
  const utils = trpc.useUtils();
  return trpc.banners.update.useMutation({
    onSuccess: () => {
      void utils.banners.invalidate();
    },
  });
}
