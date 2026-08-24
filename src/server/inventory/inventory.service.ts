import { TRPCError } from "@trpc/server";
import { captureException } from "@/lib/sentry";
import { adjustStock, listStockHistory, listStockLevels } from "./inventory.db";
import { appError } from "../app-error";

export async function applyStockAdjustment(record: {
  productId: string;
  changeAmount: number;
  reason: "restock" | "sale" | "return" | "adjustment" | "damage" | "other";
  note?: string;
  createdByUserId: string | null;
}): Promise<number> {
  // adjustStock raises the boundary case itself; anything else here is a real
  // fault (a dropped connection, an unknown product) and must not be disguised
  // as a stock rejection — that masking turns a ten-minute diagnosis into a day
  try {
    return await adjustStock({ ...record, note: record.note ?? null });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    captureException(error);
    throw appError("INTERNAL_SERVER_ERROR", "generic");
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
