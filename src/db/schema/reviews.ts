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
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reviews_productId_idx").on(table.productId),
  check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
]);
