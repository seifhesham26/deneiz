"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetAdminCategories() {
  return trpc.categories.getAll.useQuery();
}
