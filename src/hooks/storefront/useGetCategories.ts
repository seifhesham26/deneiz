"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetCategories(activeOnly = true) {
  return trpc.categories.getActive.useQuery(undefined, {
    enabled: activeOnly,
  });
}
