import { z } from "zod";
import { LOW_STOCK_DEFAULT_THRESHOLD, MAX_PAGE_SIZE } from "@/lib/constants";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const adjustStockInputSchema = z.object({
  productId: z.uuid(),
  /** Signed delta — negative for deductions, never zero */
  changeAmount: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, { message: "changeNonZero" }),
  reason: z.enum(["restock", "sale", "return", "adjustment", "damage", "other"]).default("adjustment"),
  note: optionalText(500),
});

export const stockHistoryInputSchema = z.object({
  productId: z.uuid(),
  limit: z.coerce.number().int().positive().max(48).default(20),
});

/** Stock listing filters — previously declared inline in the router. */
export const stockLevelsInputSchema = z.object({
  search: z.string().trim().optional(),
  threshold: z.coerce.number().int().min(0).default(LOW_STOCK_DEFAULT_THRESHOLD),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});
