import { z } from "zod";

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
    .refine((value) => value !== 0, { message: "change must be non-zero" }),
  reason: z.enum(["restock", "sale", "return", "adjustment", "damage", "other"]).default("adjustment"),
  note: optionalText(500),
});

export const stockHistoryInputSchema = z.object({
  productId: z.uuid(),
  limit: z.coerce.number().int().positive().max(48).default(20),
});
