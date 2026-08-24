import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const storageLocationCreateSchema = z.object({
  zone: z.string().trim().min(1).max(40),
  shelf: z.string().trim().min(1).max(40),
  bin: z.string().trim().min(1).max(40),
  capacity: z.coerce.number().int().positive().default(100),
  note: optionalText(300),
});

export const productAssignmentCreateSchema = z.object({
  locationId: z.uuid(),
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(0),
});

