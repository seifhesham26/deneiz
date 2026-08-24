import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/constants";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const createReviewInputSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  authorName: z.string().trim().min(2).max(80),
  title: optionalText(120),
  body: optionalText(2000),
});

export const storefrontReviewsQuerySchema = z.object({
  productId: z.uuid(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(10),
});

export const adminReviewsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  productId: z.uuid().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});

export const moderateReviewInputSchema = z.object({
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const reviewIdInputSchema = z.object({ id: z.uuid() });
