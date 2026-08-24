import { z } from "zod";

export const CATEGORY_MAX_DEPTH = 2;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const categoryCreateSchema = z.object({
  nameEn: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().min(2).max(120),
  slug: optionalText(160),
  parentId: z.uuid().nullish(),
  descriptionEn: optionalText(2000),
  descriptionAr: optionalText(2000),
  imageUrl: optionalText(2048),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryIdInputSchema = z.object({ id: z.uuid() });
