import { publicProcedure, requireRoles, router } from "../trpc";
import { updateSettingsInputSchema, updateUserRoleInputSchema } from "./settings.validators";
import { changeStoreSettings, changeUserRole, getAdminUsers, getStoreSettings } from "./settings.service";

export const settingsRouter = router({
  /** Public because storefront chrome (footer, shipping hints) reads it too */
  getStoreSettings: publicProcedure.query(() => getStoreSettings()),

  updateSettings: requireRoles(["super_admin"])
    .input(updateSettingsInputSchema)
    .mutation(({ input }) => changeStoreSettings(input)),

  getUsers: requireRoles(["super_admin"]).query(() => getAdminUsers()),

  updateUserRole: requireRoles(["super_admin"])
    .input(updateUserRoleInputSchema)
    .mutation(({ ctx, input }) => changeUserRole(input.userId, input.role, ctx.user.id)),
});
