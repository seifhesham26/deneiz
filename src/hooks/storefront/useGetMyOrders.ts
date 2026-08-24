"use client";

import { trpc } from "@/lib/trpc-client";

/** `enabled` matters: /account renders for signed-out visitors too, and an
 *  ungated call there is a guaranteed UNAUTHORIZED (retried once). */
export function useGetMyOrders(page = 1, enabled = true) {
  return trpc.orders.getMine.useQuery({ page }, { enabled });
}
