"use client";

import { trpc } from "@/lib/trpc-client";

export function useTopProducts(limit = 10) {
  return trpc.analytics.topProducts.useQuery({ limit, days: 90 });
}
