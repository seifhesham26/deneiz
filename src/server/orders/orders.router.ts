import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createOrderInputSchema,
  myOrdersFiltersSchema,
  orderIdInputSchema,
  orderAdminFiltersSchema,
  setPaymentStatusInputSchema,
  updateOrderStatusInputSchema,
} from "./orders.validators";
import {
  cancelAndRestock,
  changeOrderStatus,
  changePaymentStatus,
  getOrderDetail,
  listMyOrders,
  listOrders,
  placeOrder,
} from "./orders.service";

export const ordersRouter = router({
  /** Guest checkout is allowed; ctx.user links an account when present */
  create: publicProcedure.input(createOrderInputSchema).mutation(({ input, ctx }) => {
    return placeOrder(input, ctx.user?.id ?? null);
  }),

  getMine: protectedProcedure.input(myOrdersFiltersSchema).query(({ ctx, input }) => {
    return listMyOrders(ctx.user.id, input.page, input.pageSize);
  }),

  getById: adminProcedure.input(orderIdInputSchema).query(async ({ input }) => {
    const order = await getOrderDetail(input.id);
    if (!order) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    }
    return order;
  }),

  getAll: adminProcedure.input(orderAdminFiltersSchema).query(({ input }) => {
    return listOrders(input);
  }),

  updateStatus: adminProcedure.input(updateOrderStatusInputSchema).mutation(({ input }) => {
    // Cancellation restocks lines so inventory never drifts from reality
    if (input.status === "cancelled") {
      return cancelAndRestock(input.id);
    }
    return changeOrderStatus(input.id, input.status);
  }),

  setPaymentStatus: adminProcedure.input(setPaymentStatusInputSchema).mutation(({ input }) => {
    return changePaymentStatus(input.id, input.paymentStatus);
  }),
});
