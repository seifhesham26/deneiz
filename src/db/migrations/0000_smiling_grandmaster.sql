CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'manager', 'staff', 'customer');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'collected', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."inventory_reason" AS ENUM('restock', 'sale', 'return', 'adjustment', 'damage', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."banner_placement" AS ENUM('hero', 'promo');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"issuer" text DEFAULT 'local:credential' NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"isBanned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parentId" uuid,
	"slug" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"descriptionEn" text,
	"descriptionAr" text,
	"imageUrl" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"url" text NOT NULL,
	"altText" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"sku" text,
	"size" text,
	"color" text,
	"material" text,
	"priceDelta" numeric(10, 2) DEFAULT 0 NOT NULL,
	"stockQuantity" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_stock_non_negative" CHECK ("product_variants"."stockQuantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"descriptionEn" text,
	"descriptionAr" text,
	"metaTitle" text,
	"metaDescription" text,
	"categoryId" uuid,
	"price" numeric(10, 2) NOT NULL,
	"compareAtPrice" numeric(10, 2),
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"stockQuantity" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_stock_non_negative" CHECK ("products"."stockQuantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"orderId" uuid NOT NULL,
	"productId" uuid,
	"productNameEn" text NOT NULL,
	"productNameAr" text NOT NULL,
	"variantLabel" text,
	"imageUrl" text,
	"unitPrice" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"lineTotal" numeric(10, 2) NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderNumber" text NOT NULL,
	"userId" text,
	"customerId" uuid,
	"fullName" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"addressLine1" text NOT NULL,
	"city" text NOT NULL,
	"notes" text,
	"paymentMethod" text DEFAULT 'cash_on_delivery' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"shippingFee" numeric(10, 2) DEFAULT 0 NOT NULL,
	"discountTotal" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"locale" text DEFAULT 'ar' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"changeAmount" integer NOT NULL,
	"reason" "inventory_reason" DEFAULT 'adjustment' NOT NULL,
	"note" text,
	"createdByUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_locations_pair_unique" UNIQUE("locationId","productId")
);
--> statement-breakpoint
CREATE TABLE "storage_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone" text NOT NULL,
	"shelf" text NOT NULL,
	"bin" text NOT NULL,
	"capacity" integer DEFAULT 100 NOT NULL,
	"note" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_locations_slot_unique" UNIQUE("zone","shelf","bin")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"userId" text,
	"authorName" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"isFlagged" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text,
	"fullName" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"email" text,
	"city" text,
	"isBanned" boolean DEFAULT false NOT NULL,
	"note" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phoneNumber_unique" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"placement" "banner_placement" DEFAULT 'hero' NOT NULL,
	"imageUrlDesktop" text NOT NULL,
	"imageUrlMobile" text,
	"linkUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"startsAt" timestamp with time zone,
	"endsAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"storeNameEn" text DEFAULT 'Deneiz' NOT NULL,
	"storeNameAr" text DEFAULT 'دنيز' NOT NULL,
	"supportEmail" text,
	"supportPhone" text,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"defaultLocale" text DEFAULT 'ar' NOT NULL,
	"shippingFee" numeric(10, 2) DEFAULT 25 NOT NULL,
	"freeShippingThreshold" numeric(10, 2) DEFAULT 300 NOT NULL,
	"lowStockThreshold" integer DEFAULT 5 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_categories_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_locationId_storage_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."storage_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","accountId");--> statement-breakpoint
CREATE INDEX "product_images_productId_idx" ON "product_images" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_variants_productId_idx" ON "product_variants" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "products_categoryId_idx" ON "products" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "order_items_orderId_idx" ON "order_items" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "orders_userId_idx" ON "orders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "orders_customerId_idx" ON "orders" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "orders_createdAt_idx" ON "orders" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "inventory_logs_productId_idx" ON "inventory_logs" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "reviews_productId_idx" ON "reviews" USING btree ("productId");