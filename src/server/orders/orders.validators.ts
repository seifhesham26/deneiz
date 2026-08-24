import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { isPlausiblePhoneNumber } from "@/utils/normalize-phone";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["pending", "collected", "refunded"] as const;

/**
 * Shape check only — the digit count is validated after normalization, so
 * "+20 123 456 7890" and "+201234567890" are judged identically and a value
 * like "+--------" (which the old pattern accepted) is rejected.
 */
const phonePattern = /^[+\d][\d\s-]{7,20}$/;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max, { message: `tooLong:${max}` }).optional(),
  );

/** Client cart is never trusted — prices are re-derived from the database. */
export const checkoutItemInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().positive().max(99),
  variantId: z.uuid().optional(),
});

/**
 * Guest order tracking. The phone number is the shared secret: an order number
 * alone must never reveal a customer's address, so both are required.
 */
export const orderLookupInputSchema = z.object({
  orderNumber: z.string().trim().min(6, { message: "tooShort:6" }).max(40, { message: "tooLong:40" }),
  phoneNumber: z
    .string()
    .trim()
    .regex(phonePattern, { message: "invalidPhone" })
    .refine(isPlausiblePhoneNumber, { message: "invalidPhone" }),
});

export const createOrderInputSchema = z.object({
  fullName: z.string().trim().min(2, { message: "tooShort:2" }).max(120, { message: "tooLong:120" }),
  phoneNumber: z
    .string()
    .trim()
    .regex(phonePattern, { message: "invalidPhone" })
    .refine(isPlausiblePhoneNumber, { message: "invalidPhone" }),
  // Optional, but the only channel an order confirmation can ever reach
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.email({ message: "invalidEmail" }).optional(),
  ),
  addressLine1: z.string().trim().min(5, { message: "tooShort:5" }).max(300, { message: "tooLong:300" }),
  city: z.string().trim().min(2, { message: "tooShort:2" }).max(80, { message: "tooLong:80" }),
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
