import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { containsPattern } from "@/utils/escape-like";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";

/** Aggregates exclude cancelled orders — banned customers still show history. */
const ordersCountSql = sql<number>`(
  select count(*)::int from orders o
  where o."customerId" = ${customers.id} and o.status <> 'cancelled'
)`;

const totalSpentSql = sql<number>`(
  select coalesce(sum(o.total), 0)::float8 from orders o
  where o."customerId" = ${customers.id} and o.status <> 'cancelled'
)`;

/** Recent-order rows shown on the admin customer profile. */
const CUSTOMER_RECENT_ORDERS = 20;

export async function listCustomers(filters: {
  search?: string;
  page: number;
  pageSize: number;
}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (filters.search) {
    conditions.push(
      or(
        ilike(customers.fullName, containsPattern(filters.search)),
        ilike(customers.email, containsPattern(filters.search)),
        ilike(customers.phoneNumber, containsPattern(filters.search)),
      ),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [items, [{ count }]] = await Promise.all([
    database
    .select({
      id: customers.id,
      userId: customers.userId,
      fullName: customers.fullName,
      phoneNumber: customers.phoneNumber,
      email: customers.email,
      city: customers.city,
      isBanned: customers.isBanned,
      createdAt: customers.createdAt,
      ordersCount: ordersCountSql,
      totalSpent: totalSpentSql,
    })
    .from(customers)
    .where(where)
    .orderBy(desc(customers.createdAt), asc(customers.id))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize),
    database
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(where),
  ]);

  return { items, total: count };
}

export async function getCustomerDetail(id: string) {
  const database = getDb();
  const [customer] = await database
    .select({
      id: customers.id,
      userId: customers.userId,
      fullName: customers.fullName,
      phoneNumber: customers.phoneNumber,
      email: customers.email,
      city: customers.city,
      isBanned: customers.isBanned,
      note: customers.note,
      createdAt: customers.createdAt,
      ordersCount: ordersCountSql,
      totalSpent: totalSpentSql,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) return null;

  const orderRows = await database
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.customerId, id), ne(orders.status, "cancelled")))
    .orderBy(desc(orders.createdAt), asc(orders.id))
    .limit(CUSTOMER_RECENT_ORDERS);

  return { ...customer, orders: orderRows };
}

export async function setCustomerBan(id: string, isBanned: boolean): Promise<void> {
  await getDb()
    .update(customers)
    .set({ isBanned, updatedAt: new Date() })
    .where(eq(customers.id, id));
}

export async function upsertCustomerByPhone(record: {
  fullName: string;
  /** Must already be normalized — this column is the customer identity key */
  phoneNumber: string;
  city: string | null;
  email: string | null;
  userId: string | null;
}): Promise<typeof customers.$inferSelect> {
  const [customer] = await getDb()
    .insert(customers)
    .values(record)
    .onConflictDoUpdate({
      target: customers.phoneNumber,
      // Fill blanks only. Anyone can type a stranger's phone number at guest
      // checkout, so an overwrite here would let them rename that customer.
      // The order row already snapshots the name used for this purchase.
      set: {
        userId: sql`coalesce(${customers.userId}, ${record.userId})`,
        email: sql`coalesce(${customers.email}, ${record.email})`,
        city: sql`coalesce(${customers.city}, ${record.city})`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return customer;
}


export async function isCustomerBannedByPhone(phoneNumber: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ isBanned: customers.isBanned })
    .from(customers)
    .where(and(eq(customers.phoneNumber, phoneNumber), eq(customers.isBanned, true)))
    .limit(1);
  return Boolean(row);
}
