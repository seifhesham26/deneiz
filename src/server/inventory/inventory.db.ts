import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { inventoryLogs, products, users } from "@/db/schema";

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
      throw new Error("Stock adjustment rejected — result would go below zero");
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
      or(ilike(products.nameEn, `%${filters.search}%`), ilike(products.nameAr, `%${filters.search}%`)),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const items = await database
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
    .orderBy(sql`${products.stockQuantity} asc`)
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const [{ count }] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const [{ lowStockCount }] = await database
    .select({ lowStockCount: sql<number>`count(*)::int` })
    .from(products)
    .where(sql`${products.stockQuantity} <= ${filters.threshold}`);

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
    .orderBy(desc(inventoryLogs.createdAt))
    .limit(limit);
}

export async function getProductStock(productId: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ stockQuantity: products.stockQuantity })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return row?.stockQuantity ?? null;
}
