import { z } from "zod";

/** z.coerce.boolean() is Boolean(value), so the string "false" would be true. */
const boolish = z.preprocess(
  (value) => (typeof value === "string" ? value === "true" : value),
  z.boolean(),
);

export const BANNER_PLACEMENTS = ["hero", "promo"] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const bannerCreateSchema = z.object({
  title: optionalText(160),
  placement: z.enum(BANNER_PLACEMENTS).default("hero"),
  imageUrlDesktop: z.string().trim().min(1).max(2048),
  imageUrlMobile: optionalText(2048),
  linkUrl: optionalText(2048),
  isActive: boolish.default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
});

export const bannerUpdateSchema = bannerCreateSchema.partial();

export const bannerIdInputSchema = z.object({ id: z.uuid() });
