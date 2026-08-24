import { appError } from "../app-error";
import {
  createStorageLocation,
  getStorageLocation,
  sumLocationQuantity,
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
  // One location and one SUM, not two full table scans filtered in JS
  const [target, alreadyStored] = await Promise.all([
    getStorageLocation(record.locationId),
    sumLocationQuantity(record.locationId, record.productId),
  ]);
  if (!target) throw appError("NOT_FOUND", "locationNotFound");

  if (alreadyStored + record.quantity > target.capacity) {
    throw appError("CONFLICT", "capacityExceeded", {
      free: target.capacity - alreadyStored,
      location: locationLabel(target),
    });
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
