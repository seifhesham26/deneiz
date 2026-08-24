"use client";

import { trpc } from "@/lib/trpc-client";

export function useSetCustomerBan() {
  const utils = trpc.useUtils();
  return trpc.customers.setBan.useMutation({
    onSuccess: () => {
      void utils.customers.invalidate();
    },
  });
}
