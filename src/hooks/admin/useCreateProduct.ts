"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateProduct() {
  const invalidateAll = useInvalidateAll();
  return trpc.products.create.useMutation({ onSuccess: () => invalidateAll() });
}
