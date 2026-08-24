import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Customer records cover both registered shoppers and guest checkouts.
 * Guests are keyed by phone number at order time; userId links an
 * account when one exists so the admin sees a single profile per person.
 */
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  fullName: text("fullName").notNull(),
  phoneNumber: text("phoneNumber").notNull().unique(),
  email: text("email"),
  city: text("city"),
  isBanned: boolean("isBanned").notNull().default(false),
  note: text("note"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
