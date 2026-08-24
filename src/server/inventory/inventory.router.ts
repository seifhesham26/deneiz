import { adminProcedure, router } from "../trpc";
import {
  adjustStockInputSchema,
  stockHistoryInputSchema,
  stockLevelsInputSchema,
} from "./inventory.validators";
import { applyStockAdjustment, getStockHistory, getStockLevels } from "./inventory.service";

export const inventoryRouter = router({
  getLevels: adminProcedure
    .input(stockLevelsInputSchema)
    .query(({ input }) => getStockLevels(input)),

  adjust: adminProcedure.input(adjustStockInputSchema).mutation(({ ctx, input }) => {
    return applyStockAdjustment({ ...input, createdByUserId: ctx.user.id });
  }),

  getHistory: adminProcedure.input(stockHistoryInputSchema).query(({ input }) => {
    return getStockHistory(input.productId, input.limit);
  }),
});
