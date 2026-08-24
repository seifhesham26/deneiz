"use client";

import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/dictionary";

export function orderStatusTone(status: string): "warning" | "info" | "success" | "danger" | "neutral" {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
    case "shipped":
      return "info";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

interface OrderStatusBadgeProps {
  status: string;
  t: Dictionary;
}

export function OrderStatusBadge({ status, t }: OrderStatusBadgeProps) {
  const map = t.statuses.order as Record<string, string>;
  return (
    <Badge tone={orderStatusTone(status)}>
      {map[status] ?? status}
    </Badge>
  );
}
