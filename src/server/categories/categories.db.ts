import { and, asc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";

export async function listCategories(options: { activeOnly?: boolean } = {}) {
  const database = getDb();
  const conditions: (SQL | undefined)[] = [];
  if (options.activeOnly) conditions.push(eq(categories.isActive, true));

  return database
    .select()
    .from(categories)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(categories.displayOrder), asc(categories.nameEn));
}

export async function getCategoryById(id: string) {
  const [category] = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return category ?? null;
}

export async function findCategorySlugMatches(prefix: string): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: categories.slug })
    .from(categories)
    .where(ilike(categories.slug, `${prefix}%`));
  return rows.map((row) => row.slug);
}

export async function insertCategory(
  values: typeof categories.$inferInsert,
): Promise<typeof categories.$inferSelect> {
  const [created] = await getDb().insert(categories).values(values).returning();
  return created;
}

export async function updateCategory(
  id: string,
  patch: Partial<typeof categories.$inferInsert>,
): Promise<void> {
  await getDb()
    .update(categories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(categories.id, id));
}

/** Category deletion orphans child categories via FK set null. */
export async function deleteCategory(id: string): Promise<void> {
  await getDb().delete(categories).where(eq(categories.id, id));
}

export async function countProductsInCategory(categoryId: string): Promise<number> {
  const [{ count }] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categoryId, categoryId));
  return count;
}

/** Depth guard: a category with children may not itself be nested. */
export async function countChildren(categoryId: string): Promise<number> {
  const [{ count }] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(categories)
    .where(eq(categories.parentId, categoryId));
  return count;
}
