"use client";

import { trpc } from "@/lib/trpc-client";

/** Dashboard KPIs, recent orders, low-stock alerts, and the revenue series. */
export function useGetAnalytics() {
  return trpc.analytics.getDashboard.useQuery();
}
