"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetProductBySlug(slug: string | undefined) {
  return trpc.products.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(slug) },
  );
}
