import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "published",
  "archived",
]);

/** Money column: numeric(10,2) with number mode so math stays in JS numbers. */
const money = (name: string) =>
  numeric(name, { precision: 10, scale: 2, mode: "number" });

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("nameEn").notNull(),
  nameAr: text("nameAr").notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  categoryId: uuid("categoryId").references(() => categories.id, {
    onDelete: "set null",
  }),
  price: money("price").notNull(),
  compareAtPrice: money("compareAtPrice"),
  status: productStatusEnum("status").notNull().default("draft"),
  isFeatured: boolean("isFeatured").notNull().default(false),
  stockQuantity: integer("stockQuantity").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("altText"),
  displayOrder: integer("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku"),
  size: text("size"),
  color: text("color"),
  material: text("material"),
  priceDelta: money("priceDelta").notNull().default(0),
  stockQuantity: integer("stockQuantity").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});
