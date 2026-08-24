"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetBanners(placement?: "hero" | "promo") {
  return trpc.banners.getActive.useQuery({ placement });
}
