import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

/** Canonical literals — kept here (not in the schema) so this module stays
 *  dependency-free and importable from client code. */
export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export const PRODUCT_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "top_rated",
] as const;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional(),
  );

const money = z.coerce.number().nonnegative().max(999_999);
/** Sale price: an empty form field coerces to 0, which would publish a free product. */
const positiveMoney = money.refine((value) => value > 0, { message: "pricePositive" });
const boolish = z.preprocess(
  (value) => (typeof value === "string" ? value === "true" : value),
  z.boolean(),
);

export const productFiltersSchema = z
  .object({
    search: optionalText(120),
    categorySlug: optionalText(160),
    minPrice: money.optional(),
    maxPrice: money.optional(),
    sort: z.enum(PRODUCT_SORTS).default("newest"),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    featuredOnly: boolish.optional(),
  })
  .refine(
    (filters) =>
      filters.minPrice === undefined ||
      filters.maxPrice === undefined ||
      filters.minPrice <= filters.maxPrice,
    { message: "invalidRange" },
  );

/** Admin listing filters — previously declared inline in the router. */
export const adminProductFiltersSchema = z.object({
  search: optionalText(120),
  status: z.enum(PRODUCT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});

export const productImageInputSchema = z.object({
  // Relative upload path or absolute http(s) URL — never javascript:
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
      message: "invalidUrl",
    }),
  altText: optionalText(200),
});

export const productVariantInputSchema = z.object({
  // Present on edit so variants can be diffed instead of replaced wholesale,
  // which would reissue every id and orphan the variantId carts persist
  id: z.uuid().optional(),
  sku: optionalText(64),
  size: optionalText(40),
  color: optionalText(40),
  material: optionalText(40),
  priceDelta: money.default(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
});

export const productCreateSchema = z.object({
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().min(2).max(160),
  slug: optionalText(180),
  descriptionEn: optionalText(5000),
  descriptionAr: optionalText(5000),
  metaTitle: optionalText(200),
  metaDescription: optionalText(320),
  categoryId: z.uuid().nullish(),
  price: positiveMoney,
  compareAtPrice: money.nullish(),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  isFeatured: boolish.default(false),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  images: z.array(productImageInputSchema).max(10).default([]),
  variants: z.array(productVariantInputSchema).max(30).default([]),
});

/** A strike-through price below the sale price renders no badge at all. */
const compareAbovePrice = (values: { price?: number; compareAtPrice?: number | null }) =>
  values.compareAtPrice == null || values.price === undefined || values.compareAtPrice > values.price;

export const productCreateInputSchema = productCreateSchema.refine(compareAbovePrice, {
  message: "compareAbovePrice",
  path: ["compareAtPrice"],
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .refine(compareAbovePrice, { message: "compareAbovePrice", path: ["compareAtPrice"] });

export const productIdInputSchema = z.object({ id: z.uuid() });

export const productSlugInputSchema = z.object({ slug: z.string().trim().min(1) });

export type ProductSortValue = (typeof PRODUCT_SORTS)[number];

export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export type ProductFilters = z.output<typeof productFiltersSchema>;
