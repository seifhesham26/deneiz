import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { users } from "./users";

export const inventoryReasonEnum = pgEnum("inventory_reason", [
  "restock",
  "sale",
  "return",
  "adjustment",
  "damage",
  "other",
]);

/**
 * Append-only stock ledger. Every stock change — sales, restocks, manual
 * corrections — gets a row so the current product.stockQuantity is always
 * auditable.
 */
export const inventoryLogs = pgTable("inventory_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  changeAmount: integer("changeAmount").notNull(),
  reason: inventoryReasonEnum("reason").notNull().default("adjustment"),
  note: text("note"),
  createdByUserId: text("createdByUserId").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("inventory_logs_productId_idx").on(table.productId)]);
