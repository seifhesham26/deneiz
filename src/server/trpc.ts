import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError, flattenError } from "zod";
import superjson from "superjson";
import { getAuth } from "@/lib/better-auth";

/** Role union mirrored from the database enum. */
export type UserRole = "super_admin" | "manager" | "staff" | "customer";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  isBanned: boolean;
}

export interface TrpcContext {
  user: SessionUser | null;
  clientIp: string;
}

/**
 * Builds request-scoped context: the Better Auth session (when valid) plus the
 * caller IP for rate limiting. A failing session lookup degrades to guest —
 * an unreachable database must not 500 every public query.
 */
export async function createTRPCContext(request: Request): Promise<TrpcContext> {
  let user: SessionUser | null = null;
  try {
    const result = await getAuth().api.getSession({ headers: request.headers });
    if (result?.user) {
      user = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        image: result.user.image ?? null,
        role: (result.user.role as UserRole | undefined) ?? "customer",
        isBanned: Boolean(result.user.isBanned),
      };
    }
  } catch {
    user = null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

  return { user, clientIp };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Structured field errors let forms highlight inputs per locale
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? flattenError(error.cause)
            : null,
      },
    };
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  if (ctx.user.isBanned) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const ADMIN_ROLES: readonly UserRole[] = ["super_admin", "manager", "staff"];

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ADMIN_ROLES.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/** Fine-grained guard for procedures restricted to specific roles. */
export function requireRoles(allowed: readonly UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient role" });
    }
    return next({ ctx });
  });
}
