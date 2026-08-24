import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Self-reference typed via AnyPgColumn so Drizzle accepts the circular type
  parentId: uuid("parentId").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  slug: text("slug").notNull().unique(),
  nameEn: text("nameEn").notNull(),
  nameAr: text("nameAr").notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  imageUrl: text("imageUrl"),
  displayOrder: integer("displayOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
