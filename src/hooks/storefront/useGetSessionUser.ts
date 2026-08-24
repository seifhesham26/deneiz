"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetSessionUser() {
  const query = trpc.auth.me.useQuery();

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
  };
}
