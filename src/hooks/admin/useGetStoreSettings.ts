"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetStoreSettings() {
  return trpc.settings.getStoreSettings.useQuery();
}
