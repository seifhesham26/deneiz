import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { products } from "./products";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "collected",
  "refunded",
]);

const money = (name: string) =>
  numeric(name, { precision: 10, scale: 2, mode: "number" });

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("orderNumber").notNull().unique(),
  // users.id is text (Better Auth ids), unlike uuid business tables
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  customerId: uuid("customerId").references(() => customers.id, {
    onDelete: "set null",
  }),
  // Contact snapshot survives customer-record changes and guest checkout
  fullName: text("fullName").notNull(),
  phoneNumber: text("phoneNumber").notNull(),
  addressLine1: text("addressLine1").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  // PROTOTYPE: cash on delivery is the only payment method for now
  paymentMethod: text("paymentMethod").notNull().default("cash_on_delivery"),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("paymentStatus").notNull().default("pending"),
  subtotal: money("subtotal").notNull(),
  shippingFee: money("shippingFee").notNull().default(0),
  discountTotal: money("discountTotal").notNull().default(0),
  total: money("total").notNull(),
  locale: text("locale", { enum: ["ar", "en"] })
    .notNull()
    .default("ar"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("orders_userId_idx").on(table.userId),
  index("orders_customerId_idx").on(table.customerId),
  index("orders_createdAt_idx").on(table.createdAt),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Preserves the order the customer built their cart in — the primary key is
   *  a random UUID and sorts meaninglessly. */
  displayOrder: integer("displayOrder").notNull().default(0),
  orderId: uuid("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  // Product kept nullable on delete; name/price snapshots preserve history
  productId: uuid("productId").references(() => products.id, {
    onDelete: "set null",
  }),
  productNameEn: text("productNameEn").notNull(),
  productNameAr: text("productNameAr").notNull(),
  /** Snapshot like "Size M · Gold" — survives variant deletion */
  variantLabel: text("variantLabel"),
  imageUrl: text("imageUrl"),
  unitPrice: money("unitPrice").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: money("lineTotal").notNull(),
}, (table) => [
  index("order_items_orderId_idx").on(table.orderId),
  check("order_items_quantity_positive", sql`${table.quantity} > 0`),
]);
