import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { appError } from "../app-error";
import { orderItems, orders, products, reviews } from "@/db/schema";

export async function listApprovedReviewsForProduct(
  productId: string,
  page: number,
  pageSize: number,
) {
  const database = getDb();
  const where = and(eq(reviews.productId, productId), eq(reviews.status, "approved"));

  const [items, [{ count }]] = await Promise.all([
    database
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(where)
    .orderBy(desc(reviews.createdAt), asc(reviews.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(where),
  ]);

  return { items, total: count };
}

export async function getRatingSummary(productId: string) {
  const [summary] = await getDb()
    .select({
      average: sql<number | null>`round(avg(${reviews.rating})::numeric, 2)`,
      total: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  return { average: summary.average ?? null, total: summary.total };
}

/**
 * Did this account actually buy this product? Cancelled orders do not count —
 * a cancelled purchase is not a purchase.
 */
export async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ orderId: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, productId),
        ne(orders.status, "cancelled"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Backs the friendly duplicate message; the partial unique index is the guard. */
export async function hasReviewedProduct(userId: string, productId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return Boolean(row);
}

export async function insertReview(values: typeof reviews.$inferInsert) {
  try {
    const [created] = await getDb().insert(reviews).values(values).returning({ id: reviews.id });
    return created;
  } catch (error) {
    // The service already checks for an existing review; this catches the race
    // where two submissions arrive together and the partial unique index wins.
    if (isUniqueViolation(error)) throw appError("CONFLICT", "duplicateReview");
    throw error;
  }
}

/** Postgres unique_violation. Narrowed here rather than trusting the message text. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function listReviewsForAdmin(filters: {
  status?: "pending" | "approved" | "rejected";
  productId?: string;
  minRating?: number;
  page: number;
  pageSize: number;
}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (filters.status) conditions.push(eq(reviews.status, filters.status));
  if (filters.productId) conditions.push(eq(reviews.productId, filters.productId));
  if (filters.minRating) conditions.push(gte(reviews.rating, filters.minRating));
  const where = conditions.length ? and(...conditions) : undefined;

  const [items, [{ count }]] = await Promise.all([
    database
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      status: reviews.status,
      isFlagged: reviews.isFlagged,
      createdAt: reviews.createdAt,
      productNameEn: products.nameEn,
      productNameAr: products.nameAr,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(where)
    .orderBy(desc(reviews.isFlagged), desc(reviews.createdAt), asc(reviews.id))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(where),
  ]);

  return { items, total: count };
}

export async function setReviewStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<void> {
  await getDb().update(reviews).set({ status }).where(eq(reviews.id, id));
}

export async function setReviewFlagged(id: string, isFlagged: boolean): Promise<void> {
  await getDb().update(reviews).set({ isFlagged }).where(eq(reviews.id, id));
}

export async function deleteReview(id: string): Promise<void> {
  await getDb().delete(reviews).where(eq(reviews.id, id));
}
