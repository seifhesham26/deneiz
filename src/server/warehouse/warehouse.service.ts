import {
  createStorageLocation,
  listAssignments,
  listStorageLocations,
  upsertAssignment,
  type StorageLocationRow,
} from "./warehouse.db";

/**
 * Capacity is enforced on the location level: the assignment being written
 * plus everything already stored must fit within the declared capacity.
 */
export async function assignProductToLocation(record: {
  locationId: string;
  productId: string;
  quantity: number;
}): Promise<void> {
  const locations = await listStorageLocations();
  const target = locations.find((location) => location.id === record.locationId);
  if (!target) throw new Error("Location not found");

  const existingAssignment = await listAssignments();
  const alreadyStored =
    existingAssignment
      .filter((assignment) => assignment.locationId === record.locationId && assignment.productId !== record.productId)
      .reduce((sum, assignment) => sum + assignment.quantity, 0);

  if (alreadyStored + record.quantity > target.capacity) {
    throw new Error(
      `Capacity exceeded — ${target.capacity - alreadyStored} unit(s) free at ${locationLabel(target)}`,
    );
  }

  await upsertAssignment(record);
}

function locationLabel(location: StorageLocationRow): string {
  return `${location.zone}/${location.shelf}/${location.bin}`;
}

export async function getWarehouseOverview() {
  return listStorageLocations();
}

export async function getWarehouseAssignments() {
  return listAssignments();
}

export async function addStorageLocation(values: {
  zone: string;
  shelf: string;
  bin: string;
  capacity: number;
  note?: string;
}) {
  return createStorageLocation(values);
}
