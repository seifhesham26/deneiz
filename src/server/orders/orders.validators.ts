import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/constants";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["pending", "collected", "refunded"] as const;

// Saudi/Gulf mobile-friendly: digits with optional +, spaces, dashes
const phonePattern = /^[+\d][\d\s-]{7,14}$/;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

/** Client cart is never trusted — prices are re-derived from the database. */
export const checkoutItemInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().positive().max(99),
  variantId: z.uuid().optional(),
  variantLabel: z.string().trim().max(120).optional(),
});

export const createOrderInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().regex(phonePattern),
  addressLine1: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  notes: optionalText(1000),
  paymentMethod: z.literal("cash_on_delivery"),
  locale: z.enum(["ar", "en"]).default("ar"),
  items: z.array(checkoutItemInputSchema).min(1).max(50),
});

export const orderIdInputSchema = z.object({ id: z.uuid() });

export const updateOrderStatusInputSchema = z.object({
  id: z.uuid(),
  status: z.enum(ORDER_STATUSES),
});

export const setPaymentStatusInputSchema = z.object({
  id: z.uuid(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export const orderAdminFiltersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  search: optionalText(80),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});

export const myOrdersFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(10),
});
