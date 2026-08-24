"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetOrderById(id: string | undefined) {
  return trpc.orders.getById.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );
}
