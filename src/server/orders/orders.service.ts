import { ORDER_NUMBER_PREFIX } from "@/lib/constants";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { adjustStock } from "../inventory/inventory.db";
import { getSettings } from "@/server/settings/settings.db";
import { upsertCustomerByPhone, isCustomerBannedByPhone } from "../customers/customers.db";
import { getProductsByIds, getVariantsByIds } from "../products/products.db";
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

const ORDER_NUMBER_ATTEMPTS = 5;

/** DNZ-YYYYMMDD-XXXX — date part aids phone support, random tail avoids collisions. */
async function generateOrderNumber(): Promise<string> {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${ORDER_NUMBER_PREFIX}-${datePart}-${tail}`;
    if (!(await isOrderNumberTaken(candidate))) return candidate;
  }
  throw new Error("Could not allocate a unique order number");
}

export async function placeOrder(input: CreateOrderInput, userId: string | null) {
  const banned = await isCustomerBannedByPhone(input.phoneNumber);
  if (banned) throw new Error("This phone number cannot place orders");

  // Prices always come from the database — the client cart is untrusted
  const productRows = await getProductsByIds(input.items.map((item) => item.productId));
  const productMap = new Map(productRows.map((row) => [row.id, row]));

  const variantRows = await getVariantsByIds(
    input.items.filter((item) => item.variantId).map((item) => item.variantId!),
  );
  const variantMap = new Map(variantRows.map((row) => [row.id, row]));

  let subtotal = 0;
  const items = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("A product in your cart no longer exists");
    if (product.status !== "published") throw new Error(`"${product.nameEn}" is not available`);

    // A claimed variant must belong to this product — otherwise ignore it
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    const validVariant =
      variant && variant.productId === product.id
        ? variant
        : undefined;

    // PROTOTYPE: stock is enforced per product; per-variant stock enforcement lands with the warehouse pick-list work
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Only ${product.stockQuantity} left of "${product.nameEn}"`);
    }

    const unitPrice = Math.round(
      (product.price + (validVariant?.priceDelta ?? 0)) * 100,
    ) / 100;
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;

    const labelParts = [validVariant?.size, validVariant?.color, validVariant?.material]
      .filter(Boolean)
      .join(" · ");

    return {
      productId: product.id,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
      imageUrl: null as string | null,
      variantLabel: labelParts.length > 0 ? labelParts : null,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const settingsRow = await getSettings();
  const shippingFee =
    subtotal >= settingsRow.freeShippingThreshold ? 0 : settingsRow.shippingFee;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const customer = await upsertCustomerByPhone({
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    city: input.city,
  });

  const orderNumber = await generateOrderNumber();
  const order = await placeOrderAtomic(
    {
      orderNumber,
      userId,
      customerId: customer.id,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      addressLine1: input.addressLine1,
      city: input.city,
      notes: input.notes ?? null,
      subtotal,
      shippingFee,
      total,
      locale: input.locale,
      items,
    },
  );

  // Fire-and-forget: confirmation email must never block the checkout response
  void sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    recipientEmail: customer.email,
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
  if (!record) throw new Error("Order not found");
  if (record.status === "cancelled") return;
  if (record.paymentStatus === "collected") {
    throw new Error("Collected orders must be refunded before cancellation");
  }

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

export async function changeOrderStatus(orderId: string, status: CreateStatusValue) {
  await persistOrderStatus(orderId, status);
}

export async function changePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "collected" | "refunded",
) {
  await persistPaymentStatus(orderId, paymentStatus);
}

type CreateStatusValue = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export async function listOrders(filters: {
  status?: CreateStatusValue;
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
