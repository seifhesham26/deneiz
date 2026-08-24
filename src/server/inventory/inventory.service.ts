import { adjustStock, listStockHistory, listStockLevels } from "./inventory.db";

export async function applyStockAdjustment(record: {
  productId: string;
  changeAmount: number;
  reason: "restock" | "sale" | "return" | "adjustment" | "damage" | "other";
  note?: string;
  createdByUserId: string | null;
}): Promise<number> {
  try {
    return await adjustStock({
      ...record,
      note: record.note ?? null,
    });
  } catch {
    // Re-wrap the low-level guard into an operator-friendly message
    throw new Error("Stock adjustment rejected — result would go below zero");
  }
}

export async function getStockLevels(filters: {
  search?: string;
  threshold: number;
  page: number;
  pageSize: number;
}) {
  return listStockLevels(filters);
}

export async function getStockHistory(productId: string, limit: number) {
  return listStockHistory(productId, limit);
}
