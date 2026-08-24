"use client";

import { trpc } from "@/lib/trpc-client";


export function useCreateProduct() {
  const utils = trpc.useUtils();
  return trpc.products.create.useMutation({ onSuccess: () => {
      void utils.products.invalidate();
      void utils.analytics.invalidate();
    } });
}
