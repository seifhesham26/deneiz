import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/constants";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const customerListQuerySchema = z.object({
  search: optionalText(80),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});

export const customerIdInputSchema = z.object({ id: z.uuid() });

export const setCustomerBanInputSchema = z.object({
  id: z.uuid(),
  isBanned: z.boolean(),
});
