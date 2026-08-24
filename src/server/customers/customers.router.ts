import { adminProcedure, requireRoles, router } from "../trpc";
import { DESTRUCTIVE_ROLES } from "@/lib/constants";
import { TRPCError } from "@trpc/server";
import { customerIdInputSchema, customerListQuerySchema, setCustomerBanInputSchema } from "./customers.validators";
import { getCustomerOverview, getCustomerProfile, toggleCustomerBan } from "./customers.service";

export const customersRouter = router({
  getAll: adminProcedure.input(customerListQuerySchema).query(({ input }) => {
    return getCustomerOverview(input);
  }),

  getById: adminProcedure.input(customerIdInputSchema).query(async ({ input }) => {
    const profile = await getCustomerProfile(input.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }
    return profile;
  }),

  setBan: requireRoles(DESTRUCTIVE_ROLES).input(setCustomerBanInputSchema).mutation(({ input }) => {
    return toggleCustomerBan(input.id, input.isBanned);
  }),
});
