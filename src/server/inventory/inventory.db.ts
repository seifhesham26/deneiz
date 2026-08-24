import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { containsPattern } from "@/utils/escape-like";
import { getDb } from "@/db";
import { inventoryLogs, products, users } from "@/db/schema";
import { appError } from "../app-error";

/**
 * Applies a signed stock delta and appends the ledger row atomically.
 * The conditional update guards against driving stock negative under
 * concurrent checkouts.
 */
export async function adjustStock(record: {
  productId: string;
  changeAmount: number;
  reason: (typeof inventoryLogs.$inferInsert)["reason"];
  note: string | null;
  createdByUserId: string | null;
}): Promise<number> {
  const database = getDb();
  return database.transaction(async (tx) => {
    const updated = await tx
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} + ${record.changeAmount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, record.productId), sql`${products.stockQuantity} + ${record.changeAmount} >= 0`))
      .returning({ stockQuantity: products.stockQuantity });

    if (!updated.length) {
      throw appError("CONFLICT", "stockBelowZero");
    }

    await tx.insert(inventoryLogs).values({
      productId: record.productId,
      changeAmount: record.changeAmount,
      reason: record.reason,
      note: record.note,
      createdByUserId: record.createdByUserId,
    });

    return updated[0].stockQuantity;
  });
}

export async function listStockLevels(filters: {
  search?: string;
  threshold: number;
  page: number;
  pageSize: number;
}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (filters.search) {
    conditions.push(
      or(ilike(products.nameEn, containsPattern(filters.search)), ilike(products.nameAr, containsPattern(filters.search))),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [items, [{ count }], [{ lowStockCount }]] = await Promise.all([
    database
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      stockQuantity: products.stockQuantity,
      status: products.status,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(where)
    .orderBy(asc(products.stockQuantity), asc(products.id))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where),
    database
    .select({ lowStockCount: sql<number>`count(*)::int` })
    .from(products)
    // Same `where` as the rows above: a low-stock count that ignored the active
    // search would contradict the table it sits beside
    .where(and(where, sql`${products.stockQuantity} <= ${filters.threshold}`)),
  ]);

  return { items, total: count, lowStockCount };
}

export async function listStockHistory(productId: string, limit: number) {
  return getDb()
    .select({
      id: inventoryLogs.id,
      changeAmount: inventoryLogs.changeAmount,
      reason: inventoryLogs.reason,
      note: inventoryLogs.note,
      createdAt: inventoryLogs.createdAt,
      actorName: users.name,
      productNameEn: products.nameEn,
      productNameAr: products.nameAr,
    })
    .from(inventoryLogs)
    .innerJoin(products, eq(inventoryLogs.productId, products.id))
    .leftJoin(users, eq(inventoryLogs.createdByUserId, users.id))
    .where(eq(inventoryLogs.productId, productId))
    .orderBy(desc(inventoryLogs.createdAt), desc(inventoryLogs.id))
    .limit(limit);
}

