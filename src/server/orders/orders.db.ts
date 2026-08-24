import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { containsPattern } from "@/utils/escape-like";
import { getDb } from "@/db";
import { STORE_TIMEZONE } from "@/lib/constants";
import {
  categories,
  inventoryLogs,
  orderItems,
  orders,
  products,
  reviews,
} from "@/db/schema";

export interface CheckoutOrderRecord {
  orderNumber: string;
  userId: string | null;
  customerId: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  locale: "ar" | "en";
  items: {
    productId: string;
    productNameEn: string;
    productNameAr: string;
    imageUrl: string | null;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
}

/**
 * One transaction covers everything checkout mutates: stock reservation,
 * customer upsert, order + item rows, and sale entries in the stock ledger.
 */
export async function placeOrderAtomic(
  record: CheckoutOrderRecord,
): Promise<typeof orders.$inferSelect> {
  const database = getDb();
  return database.transaction(async (tx) => {
    for (const item of record.items) {
      const updated = await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, item.productId), sql`${products.stockQuantity} >= ${item.quantity}`))
        .returning({ id: products.id });

      if (!updated.length) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      await tx.insert(inventoryLogs).values({
        productId: item.productId,
        changeAmount: -item.quantity,
        reason: "sale",
        note: `Order ${record.orderNumber}`,
      });
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: record.orderNumber,
        userId: record.userId,
        customerId: record.customerId,
        fullName: record.fullName,
        phoneNumber: record.phoneNumber,
        addressLine1: record.addressLine1,
        city: record.city,
        notes: record.notes,
        status: "pending",
        paymentStatus: "pending",
        subtotal: record.subtotal,
        shippingFee: record.shippingFee,
        discountTotal: 0,
        total: record.total,
        locale: record.locale,
      })
      .returning();

    await tx.insert(orderItems).values(
      record.items.map((item, index) => ({
        orderId: order.id,
        displayOrder: index,
        productId: item.productId,
        productNameEn: item.productNameEn,
        productNameAr: item.productNameAr,
        imageUrl: item.imageUrl,
        variantLabel: item.variantLabel,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    );

    return order;
  });
}

/** Reads a timestamptz in store-local time so day/week buckets match the shop floor. */
function storeLocal(column: typeof orders.createdAt) {
  return sql`(${column} AT TIME ZONE ${STORE_TIMEZONE})`;
}

/** Midnight today, store-local, as a timestamptz. */
function storeDayStart() {
  return sql`(date_trunc('day', now() AT TIME ZONE ${STORE_TIMEZONE}) AT TIME ZONE ${STORE_TIMEZONE})`;
}

const itemListSubquery = sql<number>`(
  select coalesce(sum(oi.quantity), 0)::int from order_items oi where oi."orderId" = ${orders.id}
)`;

export async function listOrdersForAdmin(filters: {
  status?: (typeof orders.$inferSelect)["status"];
  search?: string;
  page: number;
  pageSize: number;
}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, containsPattern(filters.search)),
        ilike(orders.fullName, containsPattern(filters.search)),
        ilike(orders.phoneNumber, containsPattern(filters.search)),
      ),
    );
  }
  const where = and(...conditions);

  const [items, [{ count }]] = await Promise.all([
    database
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      fullName: orders.fullName,
      phoneNumber: orders.phoneNumber,
      city: orders.city,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
      itemCount: itemListSubquery,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt), asc(orders.id))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(where),
  ]);

  return { items, total: count };
}

export async function getOrderWithItems(id: string) {
  const database = getDb();
  const [order] = await database.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;

  const items = await database
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.displayOrder), asc(orderItems.id));

  return { ...order, items };
}

export async function updateOrderStatus(
  id: string,
  status: (typeof orders.$inferSelect)["status"],
) {
  await getDb()
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: (typeof orders.$inferSelect)["paymentStatus"],
) {
  await getDb()
    .update(orders)
    .set({ paymentStatus, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

export async function listOrdersForUser(userId: string, page: number, pageSize: number) {
  const database = getDb();
  const where = eq(orders.userId, userId);
  const [items, [{ count }]] = await Promise.all([
    database
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
      itemCount: itemListSubquery,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt), asc(orders.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(where),
  ]);

  return { items, total: count };
}

/** Dashboard KPIs — one pass over each aggregate keeps this cheap. */
export async function getDashboardStats() {
  const database = getDb();

  const [
    [revenue30d],
    [ordersToday],
    [pendingReviewsCount],
    recentOrders,
    revenueSeries,
  ] = await Promise.all([
    database
    .select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)::float8` })
    .from(orders)
    .where(
      and(
        ne(orders.status, "cancelled"),
        sql`${orders.createdAt} >= now() - interval '30 days'`,
      ),
    ),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    // Store-local day, and cancelled orders excluded to match revenue above
    .where(
      and(
        ne(orders.status, "cancelled"),
        sql`${orders.createdAt} >= ${storeDayStart()}`,
      ),
    ),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.status, "pending")),
    database
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        fullName: orders.fullName,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
    database
      .select({
        bucket: sql<string>`to_char(date_trunc('day', ${storeLocal(orders.createdAt)}), 'YYYY-MM-DD')`,
        revenue: sql<number>`sum(${orders.total})::float8`,
      })
      .from(orders)
      .where(and(ne(orders.status, "cancelled"), sql`${orders.createdAt} >= now() - interval '30 days'`))
      .groupBy(sql`date_trunc('day', ${storeLocal(orders.createdAt)})`)
      .orderBy(sql`date_trunc('day', ${storeLocal(orders.createdAt)})`),
  ]);

  return {
    revenue30d: revenue30d.revenue,
    ordersToday: ordersToday.count,
    pendingReviews: pendingReviewsCount.count,
    recentOrders,
    revenueSeries,
  };
}

export async function getSalesSeries(days: number, granularity: "daily" | "weekly" | "monthly") {
  const database = getDb();
  const bucket =
    granularity === "monthly" ? "month" : granularity === "weekly" ? "week" : "day";

  return database
    .select({
      bucket: sql<string>`to_char(date_trunc(${bucket}, ${storeLocal(orders.createdAt)}), 'YYYY-MM-DD')`,
      revenue: sql<number>`sum(${orders.total})::float8`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(ne(orders.status, "cancelled"), sql`${orders.createdAt} >= now() - (${days} || ' days')::interval`),
    )
    .groupBy(sql`date_trunc(${bucket}, ${storeLocal(orders.createdAt)})`)
    .orderBy(sql`date_trunc(${bucket}, ${storeLocal(orders.createdAt)})`);
}

export async function getTopSellingProducts(limit = 10, days = 90) {
  return getDb()
    .select({
      productId: orderItems.productId,
      nameEn: sql<string>`max(${orderItems.productNameEn})`,
      nameAr: sql<string>`max(${orderItems.productNameAr})`,
      unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.lineTotal})::float8`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        ne(orders.status, "cancelled"),
        sql`${orders.createdAt} >= now() - (${days} || ' days')::interval`,
      ),
    )
    // Grouping by the snapshot name too would split a renamed product in two
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);
}

export async function getRevenueByCategory(days = 90) {
  return getDb()
    .select({
      categoryId: products.categoryId,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      revenue: sql<number>`sum(${orderItems.lineTotal})::float8`,
    })
    .from(orderItems)
    // leftJoin: orderItems.productId is ON DELETE SET NULL, so an innerJoin
    // silently drops every deleted product's historical revenue
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        ne(orders.status, "cancelled"),
        sql`${orders.createdAt} >= now() - (${days} || ' days')::interval`,
      ),
    )
    .groupBy(products.categoryId, categories.nameEn, categories.nameAr);
}


export async function isOrderNumberTaken(orderNumber: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return Boolean(row);
}
