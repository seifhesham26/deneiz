import { publicProcedure, adminProcedure, requireRoles, router } from "../trpc";
import { appError } from "../app-error";
import { DESTRUCTIVE_ROLES } from "@/lib/constants";
import { z } from "zod";
import {
  productCreateInputSchema,
  productIdInputSchema,
  productFiltersSchema,
  productSlugInputSchema,
  productUpdateSchema,
  adminProductFiltersSchema,
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
  archiveProduct,
  destroyProduct,
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
      throw appError("NOT_FOUND", "productNotFound");
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
      throw appError("NOT_FOUND", "productNotFound");
    }
    return record;
  }),

  listAdmin: adminProcedure
    .input(adminProductFiltersSchema)
    .query(({ input }) => {
      return listProductsForAdmin(input);
    }),

  create: adminProcedure.input(productCreateInputSchema).mutation(({ input }) => {
    return createProduct(input);
  }),

  update: adminProcedure
    .input(productIdInputSchema.extend({ data: productUpdateSchema }))
    .mutation(({ input }) => {
      return updateProduct(input.id, input.data);
    }),

  /** Reversible: sets status to archived and keeps ledger + reviews intact. */
  archive: requireRoles(DESTRUCTIVE_ROLES).input(productIdInputSchema).mutation(({ input }) => {
    return archiveProduct(input.id);
  }),

  /** Irreversible — cascades away stock history and reviews. */
  delete: requireRoles(["super_admin"]).input(productIdInputSchema).mutation(({ input }) => {
    return destroyProduct(input.id);
  }),
});
