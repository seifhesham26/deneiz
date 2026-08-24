import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, productImages, productVariants, products } from "@/db/schema";
import type { ProductFilters, ProductSortValue } from "./products.validators";

/** Cover-image correlated subquery keeps list queries to a single round trip.
 *  Raw table references must quote camelCase identifiers ("productId"). */
const coverImageSql = sql<string | null>`(
  select ${productImages.url} from ${productImages}
  where ${productImages.productId} = ${products.id}
  order by ${productImages.displayOrder} asc
  limit 1
)`;

type ProductRecord = typeof products.$inferSelect;
type ProductImageRecord = typeof productImages.$inferSelect;
type ProductVariantInsert = typeof productVariants.$inferInsert;

const ratingAggregateSql = {
  avgRating: sql<number | null>`(
    select round(avg(r.rating)::numeric, 2)
    from reviews r
    where r."productId" = ${products.id} and r.status = 'approved'
  )`,
  reviewCount: sql<number>`(
    select count(*)::int
    from reviews r
    where r."productId" = ${products.id} and r.status = 'approved'
  )`,
};

function sortClause(sort: ProductSortValue) {
  switch (sort) {
    case "price_asc":
      return asc(products.price);
    case "price_desc":
      return desc(products.price);
    case "top_rated":
      return desc(sql`(
        select coalesce(avg(r.rating), 0)
        from reviews r
        where r."productId" = ${products.id} and r.status = 'approved'
      )`);
    default:
      return desc(products.createdAt);
  }
}

export interface ProductListRow {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  coverImageUrl: string | null;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  categorySlug: string | null;
  isFeatured: boolean;
  createdAt: Date;
}

/** `and()` returns undefined with no parts; callers always have at least one. */
function combineConditions(...parts: (SQL | undefined)[]): SQL {
  return and(...parts) ?? sql`true`;
}

export async function listPublishedProducts(filters: ProductFilters): Promise<{
  items: ProductListRow[];
  total: number;
}> {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [eq(products.status, "published")];

  if (filters.search) {
    conditions.push(
      or(
        ilike(products.nameEn, `%${filters.search}%`),
        ilike(products.nameAr, `%${filters.search}%`),
      ),
    );
  }
  if (filters.categorySlug) conditions.push(eq(categories.slug, filters.categorySlug));
  if (filters.minPrice !== undefined) conditions.push(gte(products.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(products.price, filters.maxPrice));
  if (filters.featuredOnly) conditions.push(eq(products.isFeatured, true));

  const where = combineConditions(...conditions);

  const rows = await database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
      coverImageUrl: coverImageSql,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(sortClause(filters.sort))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const [{ count }] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where);

  return { items: rows, total: count };
}

export async function getPublishedProductBySlug(slug: string) {
  const database = getDb();
  const [product] = await database
    .select({
      ...ratingAggregateSql,
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      descriptionEn: products.descriptionEn,
      descriptionAr: products.descriptionAr,
      metaTitle: products.metaTitle,
      metaDescription: products.metaDescription,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      categoryId: products.categoryId,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      categorySlug: categories.slug,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .limit(1);

  if (!product) return null;

  const [images, variants] = await Promise.all([
    database
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.displayOrder)),
    database
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.createdAt)),
  ]);

  return { ...product, images, variants };
}

export async function listRelatedProducts(
  categoryId: string | null,
  excludeProductId: string,
  limit = 8,
): Promise<ProductListRow[]> {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [
    eq(products.status, "published"),
    sql`${products.id} <> ${excludeProductId}`,
  ];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));

  return database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
      coverImageUrl: coverImageSql,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(combineConditions(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function listAllProductsForAdmin(filters: {
  search?: string;
  status?: "draft" | "published" | "archived";
  page: number;
  pageSize: number;
}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (filters.search) {
    conditions.push(
      or(ilike(products.nameEn, `%${filters.search}%`), ilike(products.nameAr, `%${filters.search}%`)),
    );
  }
  if (filters.status) conditions.push(eq(products.status, filters.status));
  const where = combineConditions(...conditions);

  const items = await database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      status: products.status,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      coverImageUrl: coverImageSql,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const [{ count }] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  return { items, total: count };
}

export interface FullProductRecord {
  product: ProductRecord;
  images: ProductImageRecord[];
  variants: (typeof productVariants.$inferSelect)[];
}

export async function getProductById(id: string): Promise<FullProductRecord | null> {
  const database = getDb();
  const [product] = await database.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;

  const [images, variants] = await Promise.all([
    database
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.displayOrder)),
    database
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.createdAt)),
  ]);

  return { product, images, variants };
}

export async function findSlugsTaken(prefix: string): Promise<string[]> {
  const database = getDb();
  const rows = await database
    .select({ slug: products.slug })
    .from(products)
    .where(ilike(products.slug, `${prefix}%`));
  return rows.map((row) => row.slug);
}

export async function insertFullProduct(record: {
  product: typeof products.$inferInsert;
  images: Omit<typeof productImages.$inferInsert, "productId">[];
  variants: Omit<typeof productVariants.$inferInsert, "productId">[];
}): Promise<string> {
  const database = getDb();
  return database.transaction(async (tx) => {
    const [created] = await tx.insert(products).values(record.product).returning({ id: products.id });
    const productId = created.id;

    if (record.images.length) {
      await tx.insert(productImages).values(
        record.images.map((image, index) => ({ ...image, productId, displayOrder: index })),
      );
    }
    if (record.variants.length) {
      await tx.insert(productVariants).values(
        record.variants.map((variant) => ({ ...variant, productId })),
      );
    }
    return productId;
  });
}

export async function updateFullProduct(
  id: string,
  record: {
    product: Partial<typeof products.$inferInsert>;
    images: Omit<ProductImageInsert, "productId">[];
    variants: Omit<ProductVariantInsert, "productId">[];
    replaceRelations: boolean;
  },
): Promise<void> {
  const database = getDb();
  await database.transaction(async (tx) => {
    if (Object.keys(record.product).length > 0) {
      await tx
        .update(products)
        .set({ ...record.product, updatedAt: new Date() })
        .where(eq(products.id, id));
    }

    // Images/variants are replaced wholesale — simplest correct model for
    // drag-reorder editors that always send the full ordered list
    if (record.replaceRelations) {
      await tx.delete(productImages).where(eq(productImages.productId, id));
      await tx.delete(productVariants).where(eq(productVariants.productId, id));

      if (record.images.length) {
        await tx
          .insert(productImages)
          .values(record.images.map((image, index) => ({ ...image, productId: id, displayOrder: index })));
      }
      if (record.variants.length) {
        await tx.insert(productVariants).values(record.variants.map((variant) => ({ ...variant, productId: id })));
      }
    }
  });
}

type ProductImageInsert = typeof productImages.$inferInsert;

export async function deleteProductById(id: string): Promise<void> {
  const database = getDb();
  await database.delete(products).where(eq(products.id, id));
}

export async function getProductsByIds(ids: string[]) {
  const database = getDb();
  if (!ids.length) return [];
  return database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stockQuantity: products.stockQuantity,
      status: products.status,
    })
    .from(products)
    .where(inArray(products.id, ids));
}

export async function listLowStockProducts(threshold: number, limit = 10) {
  const database = getDb();
  return database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      stockQuantity: products.stockQuantity,
      coverImageUrl: coverImageSql,
    })
    .from(products)
    .where(
      and(
        inArray(products.status, ["published", "draft"]),
        sql`${products.stockQuantity} <= ${threshold}`,
      ),
    )
    .orderBy(asc(products.stockQuantity))
    .limit(limit);
}
