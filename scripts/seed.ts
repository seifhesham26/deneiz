/**
 * Seeds demo content: categories, products with images/variants, hero +
 * promo banners, an admin user, and a customer with an order so the admin
 * dashboards have something to show.
 *
 * Run: npm run seed   (requires DATABASE_URL in .env.local)
 */
import { randomBytes, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { getAuth } from "../src/lib/better-auth";
import {
  accounts,
  banners,
  categories,
  customers,
  inventoryLogs,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  reviews,
  settings,
  users,
} from "../src/db/schema";

config({ path: ".env.local" });

const IMAGE = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

// Never hardcode a working credential in a tracked file. Both values come from
// the environment; an absent password is generated per run and printed once.
// scripts/ runs outside the app, so direct process.env here is correct.
if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed: NODE_ENV=production.");
}

const DEMO_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@deneiz.local";
const DEMO_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");

/** Deleting a real user row is opt-in — `npm run seed -- --reset`. */
const ALLOW_DESTRUCTIVE_RESET = process.argv.includes("--reset");

async function main() {
  const db = getDb();
  console.log("Seeding…");

  await db.insert(settings).values({ id: "default" }).onConflictDoNothing();

  // Admin account — created through Better Auth itself so the users row gets
  // a real hashed credential. A bare users insert (older seeds) can never sign
  // in and blocks re-signup, so replace it when found.
  const [legacyAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);

  let hasCredential = false;
  if (legacyAdmin) {
    const credentials = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, legacyAdmin.id))
      .limit(1);
    hasCredential = credentials.length > 0;

    if (!hasCredential) {
      if (!ALLOW_DESTRUCTIVE_RESET) {
        throw new Error(
          `A user row for ${DEMO_ADMIN_EMAIL} exists with no credential. ` +
            "Re-run with --reset to replace it (this deletes that user).",
        );
      }
      // Placeholder row with no sign-in path — references null out or cascade
      await db.delete(users).where(eq(users.id, legacyAdmin.id));
    }
  }

  if (!hasCredential) {
    await getAuth().api.signUpEmail({
      body: {
        name: "Deneiz Admin",
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASSWORD,
      },
    });
  }

  // Role guarantee independent of the ADMIN_EMAIL bootstrap hook (the hook
  // only fires on create; this also repairs rows created before it existed)
  await db
    .update(users)
    .set({ role: "super_admin", updatedAt: new Date() })
    .where(eq(users.email, DEMO_ADMIN_EMAIL));

  console.log(`Admin account ready — email: ${DEMO_ADMIN_EMAIL} password: ${DEMO_ADMIN_PASSWORD}`);

  const categoryRows = await db
    .insert(categories)
    .values([
      {
        slug: "rings",
        nameEn: "Rings",
        nameAr: "خواتم",
        descriptionEn: "Statement and everyday rings.",
        descriptionAr: "خواتم مميزة ويومية.",
        imageUrl: IMAGE("rings"),
        displayOrder: 1,
      },
      {
        slug: "bracelets",
        nameEn: "Bracelets",
        nameAr: "أساور",
        descriptionEn: "Chain, cuff and beaded bracelets.",
        descriptionAr: "أساور سلسلة وأسورة وحبات.",
        imageUrl: IMAGE("bracelets"),
        displayOrder: 2,
      },
      {
        slug: "earrings",
        nameEn: "Earrings",
        nameAr: "أقراط",
        descriptionEn: "Studs, hoops and drops.",
        descriptionAr: "دلايات وحلق وأقراط طويلة.",
        imageUrl: IMAGE("earrings"),
        displayOrder: 3,
      },
      {
        slug: "necklaces",
        nameEn: "Necklaces",
        nameAr: "قلائد",
        descriptionEn: "Pendants and layered chains.",
        descriptionAr: "دلايات وسلاسل متعددة الطبقات.",
        imageUrl: IMAGE("necklaces"),
        displayOrder: 4,
      },
    ])
    .onConflictDoNothing()
    .returning();

  if (categoryRows.length === 0) {
    console.log("Categories already present — nothing to seed.");
    return;
  }

  type SeedProduct = {
    categorySlug: string;
    nameEn: string;
    nameAr: string;
    price: number;
    compareAtPrice?: number;
    featured?: boolean;
    stock: number;
  };

  const catalog: SeedProduct[] = [
    { categorySlug: "rings", nameEn: "Silver Band Ring", nameAr: "خاتم فضة عريض", price: 129, compareAtPrice: 159, featured: true, stock: 24 },
    { categorySlug: "rings", nameEn: "Gold Stack Ring", nameAr: "خاتم ذهبي للتنسيق", price: 149, featured: true, stock: 18 },
    { categorySlug: "rings", nameEn: "Pearl Signet Ring", nameAr: "خاتم خاتم بلؤلؤ", price: 189, stock: 9 },
    { categorySlug: "bracelets", nameEn: "Chain Link Bracelet", nameAr: "أسورة حلقات", price: 159, compareAtPrice: 199, featured: true, stock: 15 },
    { categorySlug: "bracelets", nameEn: "Beaded Charm Bracelet", nameAr: "أسورة حبات بتعليقات", price: 99, stock: 30 },
    { categorySlug: "earrings", nameEn: "Classic Gold Hoops", nameAr: "حلق ذهبي كلاسيكي", price: 119, featured: true, stock: 22 },
    { categorySlug: "earrings", nameEn: "Crystal Drop Earrings", nameAr: "أقراط بلور متدلية", price: 139, stock: 12 },
    { categorySlug: "necklaces", nameEn: "Layered Chain Necklace", nameAr: "قلادة سلاسل متراكبة", price: 179, compareAtPrice: 229, featured: true, stock: 10 },
    { categorySlug: "necklaces", nameEn: "Initial Pendant", nameAr: "قلادة حرف أول", price: 145, stock: 16 },
  ];

  for (const item of catalog) {
    const category = categoryRows.find((row) => row.slug === item.categorySlug);
    if (!category) continue;

    const slug = item.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [product] = await db
      .insert(products)
      .values({
        slug,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEn: `${item.nameEn} — crafted to last, designed to be noticed.`,
        descriptionAr: `${item.nameAr} — مصنوعة لتدوم، مصممة لتُلفت الأنظار.`,
        metaTitle: `${item.nameEn} | Deneiz`,
        categoryId: category.id,
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        status: "published",
        isFeatured: item.featured ?? false,
        stockQuantity: item.stock,
      })
      .returning();

    await db.insert(productImages).values([
      { productId: product.id, url: IMAGE(slug), altText: item.nameEn, displayOrder: 0 },
      { productId: product.id, url: IMAGE(`${slug}-2`), altText: item.nameEn, displayOrder: 1 },
    ]);

    await db.insert(productVariants).values([
      { productId: product.id, size: "S", color: null, material: null, priceDelta: 0, stockQuantity: Math.ceil(item.stock / 2) },
      { productId: product.id, size: "M", color: null, material: null, priceDelta: 0, stockQuantity: Math.floor(item.stock / 2) },
    ]);
  }

  await db.insert(banners).values([
    {
      title: "Hero — seasonal collection",
      placement: "hero",
      imageUrlDesktop: IMAGE("hero-desktop-wide"),
      imageUrlMobile: IMAGE("hero-mobile-tall"),
      linkUrl: "/products",
      isActive: true,
      displayOrder: 1,
    },
    {
      title: "Promo — launch pricing",
      placement: "promo",
      imageUrlDesktop: IMAGE("promo-desktop"),
      imageUrlMobile: IMAGE("promo-mobile"),
      linkUrl: "/products?featuredOnly=true",
      isActive: true,
      displayOrder: 1,
    },
  ]);

  // One delivered-looking order so the dashboard has data
  const [firstProduct] = await db.select().from(products).limit(1);
  if (firstProduct) {
    const customerId = randomUUID();
    await db.insert(customers).values({
      id: customerId,
      fullName: "Sara Alharbi",
      phoneNumber: "+966550000001",
      city: "Riyadh",
    });

    const orderId = randomUUID();
    await db.insert(orders).values({
      id: orderId,
      orderNumber: "DNZ-20260101-DEMO",
      customerId,
      fullName: "Sara Alharbi",
      phoneNumber: "+966550000001",
      addressLine1: "King Fahd Road, Building 12",
      city: "Riyadh",
      status: "delivered",
      paymentStatus: "collected",
      subtotal: firstProduct.price,
      shippingFee: 0,
      discountTotal: 0,
      total: firstProduct.price,
      locale: "ar",
    });
    await db.insert(orderItems).values({
      orderId,
      productId: firstProduct.id,
      productNameEn: firstProduct.nameEn,
      productNameAr: firstProduct.nameAr,
      unitPrice: firstProduct.price,
      quantity: 1,
      lineTotal: firstProduct.price,
    });
    await db.insert(inventoryLogs).values({
      productId: firstProduct.id,
      changeAmount: -1,
      reason: "sale",
      note: "Seed order DNZ-20260101-DEMO",
    });

    await db.insert(reviews).values({
      productId: firstProduct.id,
      authorName: "Sara A.",
      rating: 5,
      title: "Beautiful piece",
      body: "Exactly as pictured and it arrived quickly.",
      status: "approved",
    });
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
