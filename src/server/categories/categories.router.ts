import { publicProcedure, adminProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  categoryCreateSchema,
  categoryIdInputSchema,
  categoryUpdateSchema,
} from "./categories.validators";
import { getCategoryById, listCategories } from "./categories.db";
import { createCategory, editCategory, removeCategory } from "./categories.service";

export const categoriesRouter = router({
  getActive: publicProcedure.query(() => listCategories({ activeOnly: true })),

  getAll: adminProcedure.query(() => listCategories()),

  getById: adminProcedure.input(categoryIdInputSchema).query(async ({ input }) => {
    const category = await getCategoryById(input.id);
    if (!category) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    }
    return category;
  }),

  create: adminProcedure.input(categoryCreateSchema).mutation(({ input }) => {
    return createCategory(input);
  }),

  update: adminProcedure
    .input(categoryIdInputSchema.extend({ data: categoryUpdateSchema }))
    .mutation(({ input }) => {
      return editCategory(input.id, input.data);
    }),

  delete: adminProcedure.input(categoryIdInputSchema).mutation(({ input }) => {
    return removeCategory(input.id);
  }),
});
