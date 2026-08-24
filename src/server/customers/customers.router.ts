import { adminProcedure, requireRoles, router } from "../trpc";
import { appError } from "../app-error";
import { DESTRUCTIVE_ROLES } from "@/lib/constants";
import { customerIdInputSchema, customerListQuerySchema, setCustomerBanInputSchema } from "./customers.validators";
import { getCustomerOverview, getCustomerProfile, toggleCustomerBan } from "./customers.service";

export const customersRouter = router({
  getAll: adminProcedure.input(customerListQuerySchema).query(({ input }) => {
    return getCustomerOverview(input);
  }),

  getById: adminProcedure.input(customerIdInputSchema).query(async ({ input }) => {
    const profile = await getCustomerProfile(input.id);
    if (!profile) {
      throw appError("NOT_FOUND", "customerNotFound");
    }
    return profile;
  }),

  setBan: requireRoles(DESTRUCTIVE_ROLES).input(setCustomerBanInputSchema).mutation(({ input }) => {
    return toggleCustomerBan(input.id, input.isBanned);
  }),
});
