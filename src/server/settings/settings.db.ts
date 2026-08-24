import { asc, eq } from "drizzle-orm";
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
  return fallback;
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
