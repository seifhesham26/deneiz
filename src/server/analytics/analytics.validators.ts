import { z } from "zod";

export const ANALYTICS_GRANULARITIES = ["daily", "weekly", "monthly"] as const;

export const salesRangeInputSchema = z.object({
  granularity: z.enum(ANALYTICS_GRANULARITIES).default("daily"),
  days: z.coerce.number().int().min(7).max(365).default(30),
});
