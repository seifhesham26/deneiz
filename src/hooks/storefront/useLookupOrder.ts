"use client";

import { trpc } from "@/lib/trpc-client";

/**
 * A mutation rather than a query: the lookup takes a secret (the phone number),
 * is rate limited, and must not be cached or refetched on window focus.
 */
export function useLookupOrder() {
  return trpc.orders.lookup.useMutation();
}
