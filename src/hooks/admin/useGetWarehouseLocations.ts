"use client";

import { trpc } from "@/lib/trpc-client";

export function useGetWarehouseLocations() {
  return trpc.warehouse.getLocations.useQuery();
}

export function useGetWarehouseAssignments() {
  return trpc.warehouse.getAssignments.useQuery();
}
