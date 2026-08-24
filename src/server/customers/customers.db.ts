import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";

/** Aggregates exclude cancelled orders — banned customers still show history. */
const ordersCountSql = sql<number>`(
  select count(*)::int from orders o
  where o."customerId" = ${customers.id} and o.status <> 'cancelled'
)`;

const totalSpentSql = sql<number>`(
  select coalesce(sum(o.total), 0)::float8 from orders o
  where o."customerId" = ${customers.id} and o.status <> 'cancelled'
)`;

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
        ilike(customers.fullName, `%${filters.search}%`),
        ilike(customers.email, `%${filters.search}%`),
        ilike(customers.phoneNumber, `%${filters.search}%`),
      ),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const items = await database
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
    .orderBy(desc(customers.createdAt))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const [{ count }] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(where);

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
      id: sql<string>`o.id`,
      orderNumber: sql<string>`o."orderNumber"`,
      status: sql<string>`o.status`,
      total: sql<number>`o.total::float8`,
      createdAt: sql<Date>`o."createdAt"`,
    })
    .from(sql`orders o`)
    .where(sql`o."customerId" = ${id} and o.status <> 'cancelled'`)
    .orderBy(sql`o."createdAt" desc`)
    .limit(20);

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
  phoneNumber: string;
  city: string | null;
}): Promise<typeof customers.$inferSelect> {
  const [customer] = await getDb()
    .insert(customers)
    .values(record)
    .onConflictDoUpdate({
      target: customers.phoneNumber,
      set: {
        // Contact details may change between orders; latest checkout wins
        fullName: record.fullName,
        city: record.city ?? undefined,
        updatedAt: new Date(),
      },
    })
    .returning();
  return customer;
}

export async function isCustomerBanned(id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ isBanned: customers.isBanned })
    .from(customers)
    .where(and(eq(customers.id, id), ne(customers.isBanned, false)))
    .limit(1);
  return Boolean(row);
}

export async function isCustomerBannedByPhone(phoneNumber: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ isBanned: customers.isBanned })
    .from(customers)
    .where(and(eq(customers.phoneNumber, phoneNumber), eq(customers.isBanned, true)))
    .limit(1);
  return Boolean(row);
}
