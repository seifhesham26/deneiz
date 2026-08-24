import { publicProcedure, adminProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { bannerCreateSchema, bannerIdInputSchema, bannerUpdateSchema } from "./banners.validators";
import { getBannerById } from "./banners.db";
import {
  editBanner,
  getAllBannersForAdmin,
  getStorefrontBanners,
  publishBanner,
  removeBanner,
} from "./banners.service";

export const bannersRouter = router({
  getActive: publicProcedure
    .input(z.object({ placement: z.enum(["hero", "promo"]).optional() }).optional())
    .query(({ input }) => {
      return getStorefrontBanners(input?.placement);
    }),

  getAll: adminProcedure.query(() => getAllBannersForAdmin()),

  getById: adminProcedure.input(bannerIdInputSchema).query(async ({ input }) => {
    const banner = await getBannerById(input.id);
    if (!banner) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Banner not found" });
    }
    return banner;
  }),

  create: adminProcedure.input(bannerCreateSchema).mutation(({ input }) => {
    return publishBanner(input);
  }),

  update: adminProcedure
    .input(bannerIdInputSchema.extend({ data: bannerUpdateSchema }))
    .mutation(({ input }) => {
      return editBanner(input.id, input.data);
    }),

  delete: adminProcedure.input(bannerIdInputSchema).mutation(({ input }) => {
    return removeBanner(input.id);
  }),
});
