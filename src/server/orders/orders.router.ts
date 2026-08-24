import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc";
import { appError } from "../app-error";
import {
  createOrderInputSchema,
  myOrdersFiltersSchema,
  orderIdInputSchema,
  orderLookupInputSchema,
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
  lookupOrder,
  placeOrder,
} from "./orders.service";

export const ordersRouter = router({
  /** Guest checkout is allowed; ctx.user links an account when present */
  create: publicProcedure.input(createOrderInputSchema).mutation(({ input, ctx }) => {
    return placeOrder(input, ctx.user?.id ?? null);
  }),

  /** Guest order tracking — order number plus the phone used at checkout */
  lookup: publicProcedure.input(orderLookupInputSchema).mutation(({ input, ctx }) => {
    return lookupOrder(input.orderNumber, input.phoneNumber, ctx.user?.id ?? ctx.clientIp);
  }),

  getMine: protectedProcedure.input(myOrdersFiltersSchema).query(({ ctx, input }) => {
    return listMyOrders(ctx.user.id, input.page, input.pageSize);
  }),

  getById: adminProcedure.input(orderIdInputSchema).query(async ({ input }) => {
    const order = await getOrderDetail(input.id);
    if (!order) {
      throw appError("NOT_FOUND", "orderNotFound");
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
