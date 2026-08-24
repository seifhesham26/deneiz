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

export const bannerPlacementEnum = pgEnum("banner_placement", ["hero", "promo"]);

const money = (name: string) =>
  numeric(name, { precision: 10, scale: 2, mode: "number" });

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  placement: bannerPlacementEnum("placement").notNull().default("hero"),
  imageUrlDesktop: text("imageUrlDesktop").notNull(),
  imageUrlMobile: text("imageUrlMobile"),
  linkUrl: text("linkUrl"),
  isActive: boolean("isActive").notNull().default(true),
  displayOrder: integer("displayOrder").notNull().default(0),
  startsAt: timestamp("startsAt", { withTimezone: true }),
  endsAt: timestamp("endsAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

/** Single-row store configuration; id stays fixed so upserts target it. */
export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("default"),
  storeNameEn: text("storeNameEn").notNull().default("Deneiz"),
  storeNameAr: text("storeNameAr").notNull().default("دنيز"),
  supportEmail: text("supportEmail"),
  supportPhone: text("supportPhone"),
  currency: text("currency").notNull().default("SAR"),
  defaultLocale: text("defaultLocale", { enum: ["ar", "en"] })
    .notNull()
    .default("ar"),
  shippingFee: money("shippingFee").notNull().default(25),
  freeShippingThreshold: money("freeShippingThreshold").notNull().default(300),
  lowStockThreshold: integer("lowStockThreshold").notNull().default(5),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
