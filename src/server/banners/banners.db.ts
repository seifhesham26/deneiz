import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { banners } from "@/db/schema";

export async function listActiveBanners(placement?: "hero" | "promo") {
  const database = getDb();
  // A banner is live when inside its optional schedule window
  const schedule = and(
    or(isNull(banners.startsAt), lte(banners.startsAt, new Date())),
    or(isNull(banners.endsAt), gt(banners.endsAt, new Date())),
  );
  const conditions = [
    eq(banners.isActive, true),
    ...(placement ? [eq(banners.placement, placement)] : []),
    schedule,
  ];

  return database
    .select()
    .from(banners)
    .where(and(...conditions))
    .orderBy(asc(banners.displayOrder));
}

export async function listAllBanners() {
  return getDb()
    .select()
    .from(banners)
    .orderBy(asc(banners.placement), asc(banners.displayOrder));
}

export async function getBannerById(id: string) {
  const [banner] = await getDb().select().from(banners).where(eq(banners.id, id)).limit(1);
  return banner ?? null;
}

export async function insertBanner(values: typeof banners.$inferInsert) {
  const [created] = await getDb().insert(banners).values(values).returning();
  return created;
}

export async function updateBanner(id: string, patch: Partial<typeof banners.$inferInsert>) {
  await getDb()
    .update(banners)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(banners.id, id));
}

export async function deleteBanner(id: string): Promise<void> {
  await getDb().delete(banners).where(eq(banners.id, id));
}
