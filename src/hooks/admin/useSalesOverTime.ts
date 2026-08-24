"use client";

import { trpc } from "@/lib/trpc-client";

export function useSalesOverTime(granularity: "daily" | "weekly" | "monthly", days = 90) {
  return trpc.analytics.salesOverTime.useQuery({ granularity, days });
}
