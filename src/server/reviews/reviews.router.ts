import { publicProcedure, adminProcedure, router } from "../trpc";
import { z } from "zod";
import {
  createReviewInputSchema,
  moderateReviewInputSchema,
  reviewIdInputSchema,
  storefrontReviewsQuerySchema,
  adminReviewsQuerySchema,
} from "./reviews.validators";
import { deleteReview, listReviewsForAdmin, setReviewFlagged, setReviewStatus } from "./reviews.db";
import {
  getProductRatingSummary,
  getStorefrontReviews,
  submitReview,
} from "./reviews.service";

export const reviewsRouter = router({
  getProductReviews: publicProcedure
    .input(storefrontReviewsQuerySchema)
    .query(({ input }) => {
      return getStorefrontReviews(input.productId, input.page, input.pageSize);
    }),

  getRatingSummary: publicProcedure.input(z.object({ productId: z.uuid() })).query(({ input }) => {
    return getProductRatingSummary(input.productId);
  }),

  create: publicProcedure.input(createReviewInputSchema).mutation(({ input, ctx }) => {
    // Client key: prefer the account, fall back to IP for guests
    return submitReview({ ...input, clientKey: ctx.user?.id ?? ctx.clientIp });
  }),

  getAll: adminProcedure.input(adminReviewsQuerySchema).query(({ input }) => {
    return listReviewsForAdmin(input);
  }),

  moderate: adminProcedure.input(moderateReviewInputSchema).mutation(({ input }) => {
    return setReviewStatus(input.id, input.status);
  }),

  setFlagged: adminProcedure
    .input(reviewIdInputSchema.extend({ isFlagged: z.boolean() }))
    .mutation(({ input }) => setReviewFlagged(input.id, input.isFlagged)),

  delete: adminProcedure.input(reviewIdInputSchema).mutation(({ input }) => {
    return deleteReview(input.id);
  }),
});
