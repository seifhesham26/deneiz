"use client";

import { trpc } from "@/lib/trpc-client";

export function useRevenueByCategory() {
  return trpc.analytics.revenueByCategory.useQuery();
}
