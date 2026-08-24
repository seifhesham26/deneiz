import { publicProcedure, router } from "../trpc";

/**
 * Authentication itself runs through Better Auth's REST endpoints
 * (/api/auth/*). This router only exposes the session snapshot the UI needs.
 */
export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
      role: ctx.user.role,
      isBanned: ctx.user.isBanned,
    };
  }),
});
