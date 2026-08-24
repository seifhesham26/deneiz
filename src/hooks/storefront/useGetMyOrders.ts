"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetMyOrders(page = 1) {
  return trpc.orders.getMine.useQuery({ page });
}
