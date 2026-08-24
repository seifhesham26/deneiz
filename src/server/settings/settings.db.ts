import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { settings, users, userRoleEnum } from "@/db/schema";

export type StoreSettings = typeof settings.$inferSelect;

export async function getSettings(): Promise<StoreSettings> {
  const database = getDb();
  const [existing] = await database.select().from(settings).limit(1);
  if (existing) return existing;

  // First access materializes the singleton row with column defaults
  const [created] = await database
    .insert(settings)
    .values({ id: "default" })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const [fallback] = await database.select().from(settings).limit(1);
  // A concurrent insert always leaves a row; throwing beats returning undefined
  // through a signature that promises StoreSettings
  if (!fallback) throw new Error("Store settings row could not be materialized");
  return fallback;
}

export async function countSuperAdmins(): Promise<number> {
  const [{ count }] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "super_admin"));
  return count;
}

export async function getUserRole(userId: string): Promise<string | undefined> {
  const [row] = await getDb()
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role;
}

export async function updateSettings(
  patch: Partial<Omit<typeof settings.$inferInsert, "id">>,
): Promise<StoreSettings> {
  await getSettings();
  const [updated] = await getDb()
    .update(settings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(settings.id, "default"))
    .returning();
  return updated;
}

export async function listAdminUsers() {
  return getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isBanned: users.isBanned,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.email));
}

export async function updateUserRole(
  userId: string,
  role: (typeof userRoleEnum.enumValues)[number],
): Promise<void> {
  await getDb()
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
