import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { productLocations, products, storageLocations } from "@/db/schema";

export interface StorageLocationRow {
  id: string;
  zone: string;
  shelf: string;
  bin: string;
  capacity: number;
  note: string | null;
  storedUnits: number;
}

/** Stored units come from a correlated sum so utilization is always current. */
export async function listStorageLocations(): Promise<StorageLocationRow[]> {
  return getDb()
    .select({
      id: storageLocations.id,
      zone: storageLocations.zone,
      shelf: storageLocations.shelf,
      bin: storageLocations.bin,
      capacity: storageLocations.capacity,
      note: storageLocations.note,
      storedUnits: sql<number>`(
        select coalesce(sum(pl.quantity), 0)::int
        from product_locations pl
        where pl."locationId" = ${storageLocations.id}
      )`,
    })
    .from(storageLocations)
    .orderBy(asc(storageLocations.zone), asc(storageLocations.shelf), asc(storageLocations.bin));
}

export async function createStorageLocation(values: typeof storageLocations.$inferInsert) {
  const [created] = await getDb().insert(storageLocations).values(values).returning();
  return created;
}

export async function listAssignments() {
  return getDb()
    .select({
      id: productLocations.id,
      locationId: productLocations.locationId,
      productId: productLocations.productId,
      quantity: productLocations.quantity,
      productNameEn: products.nameEn,
      productNameAr: products.nameAr,
      zone: storageLocations.zone,
      shelf: storageLocations.shelf,
      bin: storageLocations.bin,
    })
    .from(productLocations)
    .innerJoin(products, eq(productLocations.productId, products.id))
    .innerJoin(storageLocations, eq(productLocations.locationId, storageLocations.id))
    .orderBy(asc(storageLocations.zone));
}

export async function upsertAssignment(record: {
  locationId: string;
  productId: string;
  quantity: number;
}): Promise<void> {
  await getDb()
    .insert(productLocations)
    .values(record)
    .onConflictDoUpdate({
      target: [productLocations.locationId, productLocations.productId],
      set: { quantity: record.quantity },
    });
}

export async function deleteAssignment(id: string): Promise<void> {
  await getDb().delete(productLocations).where(eq(productLocations.id, id));
}
