import { randomInt } from "node:crypto";
import { ORDER_NUMBER_PREFIX, STORE_TIMEZONE } from "@/lib/constants";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { normalizePhoneNumber } from "@/utils/normalize-phone";
import { adjustStock } from "../inventory/inventory.db";
import { appError } from "../app-error";
import { getSettings } from "@/server/settings/settings.db";
import { upsertCustomerByPhone, isCustomerBannedByPhone } from "../customers/customers.db";
import { getProductsByIds, getVariantsByIds } from "../products/products.db";
import { calculateShipping } from "@/utils/calculate-shipping";
import {
  listOrdersForAdmin,
  listOrdersForUser,
  getOrderWithItems,
  isOrderNumberTaken,
  placeOrderAtomic,
  updateOrderStatus as persistOrderStatus,
  updatePaymentStatus as persistPaymentStatus,
} from "./orders.db";
import type { z } from "zod";
import type { createOrderInputSchema } from "./orders.validators";

type CreateOrderInput = z.output<typeof createOrderInputSchema>;

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const ORDER_NUMBER_ATTEMPTS = 5;
const ORDER_NUMBER_TAIL_LENGTH = 4;
const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Which status changes are legal. Without this an admin can move a delivered
 * order back to pending, or un-cancel an order without re-deducting the stock
 * that cancellation returned — inventory drifts with no trace.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/** DNZ-YYYYMMDD-XXXX — date part aids phone support, random tail avoids collisions. */
async function generateOrderNumber(): Promise<string> {
  // Store-local date: an order placed at 01:00 Cairo belongs to that day, not
  // to the previous UTC one. en-CA renders as YYYY-MM-DD.
  const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE })
    .format(new Date())
    .replaceAll("-", "");

  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    // randomInt, not Math.random: order numbers are quoted over the phone and
    // must not be guessable from a neighbouring order
    let tail = "";
    for (let index = 0; index < ORDER_NUMBER_TAIL_LENGTH; index += 1) {
      tail += BASE36[randomInt(BASE36.length)];
    }
    const candidate = `${ORDER_NUMBER_PREFIX}-${datePart}-${tail}`;
    if (!(await isOrderNumberTaken(candidate))) return candidate;
  }
  throw appError("INTERNAL_SERVER_ERROR", "orderNumberFailed");
}

export async function placeOrder(input: CreateOrderInput, userId: string | null) {
  const canonicalPhone = normalizePhoneNumber(input.phoneNumber);
  const variantIds = input.items
    .map((item) => item.variantId)
    .filter((id): id is string => Boolean(id));

  // These four reads are independent; neon runs each as its own round trip, so
  // serialising them would add three needless hops to the checkout critical path
  const [banned, productRows, variantRows, settingsRow] = await Promise.all([
    isCustomerBannedByPhone(canonicalPhone),
    getProductsByIds(input.items.map((item) => item.productId)),
    getVariantsByIds(variantIds),
    getSettings(),
  ]);

  if (banned) throw appError("FORBIDDEN", "customerBanned");

  const productMap = new Map(productRows.map((row) => [row.id, row]));
  const variantMap = new Map(variantRows.map((row) => [row.id, row]));

  // Cart lines are keyed product+variant, so one product legitimately appears
  // on several lines. Availability must be judged on the sum, not per line,
  // or two lines of three units each pass against a stock of three.
  const requestedPerProduct = new Map<string, number>();
  for (const item of input.items) {
    requestedPerProduct.set(
      item.productId,
      (requestedPerProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, quantity] of requestedPerProduct) {
    const product = productMap.get(productId);
    if (!product) throw appError("BAD_REQUEST", "productMissing");
    if (product.status !== "published") {
      throw appError("CONFLICT", "productUnavailable", { name: product.nameEn });
    }
    if (product.stockQuantity < quantity) {
      throw appError("CONFLICT", "stockOnly", {
        count: product.stockQuantity,
        name: product.nameEn,
      });
    }
  }

  // Variant stock is a separate column; enforce it on the same aggregated basis
  const requestedPerVariant = new Map<string, number>();
  for (const item of input.items) {
    if (!item.variantId) continue;
    requestedPerVariant.set(
      item.variantId,
      (requestedPerVariant.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, quantity] of requestedPerVariant) {
    const variant = variantMap.get(variantId);
    // An unknown or foreign variant is dropped rather than rejected — the base
    // product line still stands, matching the previous ownership check
    if (!variant) continue;
    if (variant.stockQuantity < quantity) {
      const product = productMap.get(variant.productId);
      throw appError("CONFLICT", "stockOnly", {
        count: variant.stockQuantity,
        name: product?.nameEn ?? "",
      });
    }
  }

  let subtotal = 0;
  const items = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw appError("BAD_REQUEST", "productMissing");

    // A claimed variant must belong to this product — otherwise ignore it
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    const validVariant = variant && variant.productId === product.id ? variant : undefined;

    const unitPrice = Math.round((product.price + (validVariant?.priceDelta ?? 0)) * 100) / 100;
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;

    const labelParts = [validVariant?.size, validVariant?.color, validVariant?.material]
      .filter(Boolean)
      .join(" · ");

    return {
      productId: product.id,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
      imageUrl: product.coverImageUrl,
      variantLabel: labelParts.length > 0 ? labelParts : null,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const shippingFee = calculateShipping(subtotal, settingsRow);
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const customer = await upsertCustomerByPhone({
    fullName: input.fullName,
    phoneNumber: canonicalPhone,
    city: input.city,
    email: input.email ?? null,
    userId,
  });

  const orderNumber = await generateOrderNumber();
  const order = await placeOrderAtomic({
    orderNumber,
    userId,
    customerId: customer.id,
    fullName: input.fullName,
    // Snapshot keeps what the customer typed; the customer row holds the key
    phoneNumber: input.phoneNumber,
    addressLine1: input.addressLine1,
    city: input.city,
    notes: input.notes ?? null,
    subtotal,
    shippingFee,
    total,
    locale: input.locale,
    items,
  });

  // Fire-and-forget: confirmation email must never block the checkout response
  void sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    recipientEmail: input.email ?? customer.email,
    total: order.total,
  });

  return order;
}

/**
 * Cancelling restocks every line and writes return entries to the ledger so
 * inventory stays auditable end-to-end.
 */
export async function cancelAndRestock(orderId: string) {
  const record = await getOrderWithItems(orderId);
  if (!record) throw appError("NOT_FOUND", "orderNotFound");
  if (record.status === "cancelled") return;
  if (record.paymentStatus === "collected") {
    throw appError("CONFLICT", "orderCollectedCannotCancel");
  }
  assertTransitionAllowed(record.status, "cancelled");

  for (const item of record.items) {
    if (!item.productId) continue;
    await adjustStock({
      productId: item.productId,
      changeAmount: item.quantity,
      reason: "return",
      note: `Restock from cancelled order ${record.orderNumber}`,
      createdByUserId: null,
    });
  }

  await persistOrderStatus(orderId, "cancelled");
}

function assertTransitionAllowed(from: OrderStatus, to: OrderStatus): void {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw appError("CONFLICT", "invalidStatusTransition", { from, to });
  }
}

export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  const record = await getOrderWithItems(orderId);
  if (!record) throw appError("NOT_FOUND", "orderNotFound");
  assertTransitionAllowed(record.status, status);
  await persistOrderStatus(orderId, status);
}

export async function changePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "collected" | "refunded",
) {
  const record = await getOrderWithItems(orderId);
  if (!record) throw appError("NOT_FOUND", "orderNotFound");
  // A cancelled order can be refunded but never newly collected
  if (record.status === "cancelled" && paymentStatus === "collected") {
    throw appError("CONFLICT", "invalidStatusTransition", {
      from: record.status,
      to: paymentStatus,
    });
  }
  await persistPaymentStatus(orderId, paymentStatus);
}

export async function listOrders(filters: {
  status?: OrderStatus;
  search?: string;
  page: number;
  pageSize: number;
}) {
  return listOrdersForAdmin(filters);
}

export async function getOrderDetail(id: string) {
  return getOrderWithItems(id);
}

export async function listMyOrders(userId: string, page: number, pageSize: number) {
  return listOrdersForUser(userId, page, pageSize);
}
