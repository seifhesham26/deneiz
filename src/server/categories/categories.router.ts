import { publicProcedure, adminProcedure, requireRoles, router } from "../trpc";
import { appError } from "../app-error";
import { DESTRUCTIVE_ROLES } from "@/lib/constants";
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
      throw appError("NOT_FOUND", "categoryNotFound");
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

  delete: requireRoles(DESTRUCTIVE_ROLES).input(categoryIdInputSchema).mutation(({ input }) => {
    return removeCategory(input.id);
  }),
});
