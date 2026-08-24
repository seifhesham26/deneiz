import { adminProcedure, router } from "../trpc";
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

  setBan: adminProcedure.input(setCustomerBanInputSchema).mutation(({ input }) => {
    return toggleCustomerBan(input.id, input.isBanned);
  }),
});
