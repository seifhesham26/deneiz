import { z } from "zod";
import { userRoleEnum } from "@/db/schema";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const updateSettingsInputSchema = z.object({
  storeNameEn: optionalText(80),
  storeNameAr: optionalText(80),
  supportEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.email().max(200).optional(),
  ),
  supportPhone: optionalText(30),
  currency: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.string().length(3).optional(),
  ),
  defaultLocale: z.enum(["ar", "en"]).optional(),
  shippingFee: z.coerce.number().nonnegative().optional(),
  freeShippingThreshold: z.coerce.number().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export const updateUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(userRoleEnum.enumValues),
});
