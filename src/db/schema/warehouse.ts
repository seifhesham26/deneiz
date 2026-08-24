import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products";

export const storageLocations = pgTable(
  "storage_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zone: text("zone").notNull(),
    shelf: text("shelf").notNull(),
    bin: text("bin").notNull(),
    capacity: integer("capacity").notNull().default(100),
    note: text("note"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("storage_locations_slot_unique").on(table.zone, table.shelf, table.bin)],
);

export const productLocations = pgTable(
  "product_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("locationId")
      .notNull()
      .references(() => storageLocations.id, { onDelete: "cascade" }),
    productId: uuid("productId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("product_locations_pair_unique").on(table.locationId, table.productId),
  ],
);
