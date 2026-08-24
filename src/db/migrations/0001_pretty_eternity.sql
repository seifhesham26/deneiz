ALTER TABLE "order_items" ADD COLUMN "variantId" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "isVerifiedPurchase" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_product_user_unique" ON "reviews" USING btree ("productId","userId") WHERE "reviews"."userId" is not null;