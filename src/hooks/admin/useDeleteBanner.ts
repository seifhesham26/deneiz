"use client";

import { trpc } from "@/lib/trpc-client";

export function useDeleteBanner() {
  const utils = trpc.useUtils();
  return trpc.banners.delete.useMutation({
    onSuccess: () => {
      void utils.banners.invalidate();
    },
  });
}
