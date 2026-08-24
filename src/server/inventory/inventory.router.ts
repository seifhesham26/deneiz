import { adminProcedure, router } from "../trpc";
import { z } from "zod";
import {
  adjustStockInputSchema,
  stockHistoryInputSchema,
} from "./inventory.validators";
import { applyStockAdjustment, getStockHistory, getStockLevels } from "./inventory.service";

export const inventoryRouter = router({
  getLevels: adminProcedure
    .input(
      z.object({
        search: z.string().trim().optional(),
        threshold: z.coerce.number().int().min(0).default(5),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(48).default(20),
      }),
    )
    .query(({ input }) => getStockLevels(input)),

  adjust: adminProcedure.input(adjustStockInputSchema).mutation(({ ctx, input }) => {
    return applyStockAdjustment({ ...input, createdByUserId: ctx.user.id });
  }),

  getHistory: adminProcedure.input(stockHistoryInputSchema).query(({ input }) => {
    return getStockHistory(input.productId, input.limit);
  }),
});
