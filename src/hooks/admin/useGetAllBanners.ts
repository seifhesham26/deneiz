"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetAllBanners() {
  return trpc.banners.getAll.useQuery();
}
