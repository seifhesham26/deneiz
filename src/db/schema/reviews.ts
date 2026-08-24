import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { users } from "./users";

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  authorName: text("authorName").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  // Moderation gate: only approved reviews render on the storefront
  status: reviewStatusEnum("status").notNull().default("pending"),
  isFlagged: boolean("isFlagged").notNull().default(false),
  /** Set when the reviewer had actually bought the product at submission time.
   *  Stored rather than derived so the badge cannot change if an order is
   *  later cancelled or the account is deleted. */
  isVerifiedPurchase: boolean("isVerifiedPurchase").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reviews_productId_idx").on(table.productId),
  check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
  // One review per signed-in account per product. Partial, because guest
  // reviews carry no userId and must not all collide on NULL.
  uniqueIndex("reviews_product_user_unique")
    .on(table.productId, table.userId)
    .where(sql`${table.userId} is not null`),
]);
