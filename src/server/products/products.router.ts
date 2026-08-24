import { publicProcedure, adminProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  productCreateSchema,
  productIdInputSchema,
  productFiltersSchema,
  productSlugInputSchema,
  productUpdateSchema,
} from "./products.validators";
import {
  getPublishedProductBySlug,
  getProductById,
  listPublishedProducts,
  listRelatedProducts,
} from "./products.db";
import {
  createProduct,
  listProductsForAdmin,
  removeProduct,
  updateProduct,
} from "./products.service";

export const productsRouter = router({
  /** Storefront listing — published products only */
  getAll: publicProcedure.input(productFiltersSchema).query(({ input }) => {
    return listPublishedProducts(input);
  }),

  getBySlug: publicProcedure.input(productSlugInputSchema).query(async ({ input }) => {
    const product = await getPublishedProductBySlug(input.slug);
    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }
    return product;
  }),

  getRelated: publicProcedure
    .input(
      z.object({
        excludeId: z.uuid(),
        categoryId: z.uuid().nullish(),
      }),
    )
    .query(({ input }) => {
      return listRelatedProducts(input.categoryId ?? null, input.excludeId);
    }),

  getById: adminProcedure.input(productIdInputSchema).query(async ({ input }) => {
    const record = await getProductById(input.id);
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }
    return record;
  }),

  listAdmin: adminProcedure
    .input(
      z.object({
        search: z.string().trim().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(48).default(20),
      }),
    )
    .query(({ input }) => {
      return listProductsForAdmin(input);
    }),

  create: adminProcedure.input(productCreateSchema).mutation(({ input }) => {
    return createProduct(input);
  }),

  update: adminProcedure
    .input(productIdInputSchema.extend({ data: productUpdateSchema }))
    .mutation(({ input }) => {
      return updateProduct(input.id, input.data);
    }),

  delete: adminProcedure.input(productIdInputSchema).mutation(({ input }) => {
    return removeProduct(input.id);
  }),
});
