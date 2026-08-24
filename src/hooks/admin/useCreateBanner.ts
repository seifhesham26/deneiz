"use client";

import { trpc } from "@/lib/trpc-client";

export function useCreateBanner() {
  const utils = trpc.useUtils();
  return trpc.banners.create.useMutation({
    onSuccess: () => {
      void utils.banners.invalidate();
    },
  });
}
