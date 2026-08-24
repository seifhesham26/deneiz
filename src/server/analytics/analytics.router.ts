import { adminProcedure, requireRoles, router } from "../trpc";
import { z } from "zod";
import { salesRangeInputSchema } from "./analytics.validators";
import {
  buildDashboardSnapshot,
  getCategoryRevenue,
  getSalesOverTime,
  getTopProducts,
} from "./analytics.service";
import { getSettings } from "../settings/settings.db";

export const analyticsRouter = router({
  getDashboard: adminProcedure.query(async () => {
    const settingsRow = await getSettings();
    return buildDashboardSnapshot(settingsRow.lowStockThreshold);
  }),

  salesOverTime: adminProcedure.input(salesRangeInputSchema).query(({ input }) => {
    return getSalesOverTime(input.granularity, input.days);
  }),

  topProducts: adminProcedure
    .input(
      z.object({
        limit: z.coerce.number().int().min(1).max(50).default(10),
        days: z.coerce.number().int().min(7).max(365).default(90),
      }),
    )
    .query(({ input }) => getTopProducts(input.limit, input.days)),

  revenueByCategory: requireRoles(["super_admin", "manager"]).query(() => getCategoryRevenue()),
});
