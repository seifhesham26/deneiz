import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError, flattenError } from "zod";
import superjson from "superjson";
import { getAuth } from "@/lib/better-auth";
import { captureException } from "@/lib/sentry";
import { appError, AppErrorCause } from "./app-error";
import { ADMIN_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types/shared";

export type { UserRole };

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
  } catch (error) {
    // Degrading to guest is intentional for public queries, but a transient
    // database blip silently signing an admin out must not go unreported
    captureException(error);
    user = null;
  }

  // `||` not `??`: an empty x-forwarded-for yields "" , which is not nullish
  // and would otherwise shadow x-real-ip
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor || request.headers.get("x-real-ip") || "unknown";

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
        // Dictionary key + params, so the client renders business failures in
        // its own locale instead of showing a server-authored English string
        appError:
          error.cause instanceof AppErrorCause
            ? { key: error.cause.key, params: error.cause.params }
            : null,
      },
    };
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "unauthorized" });
  }
  if (ctx.user.isBanned) {
    throw appError("FORBIDDEN", "customerBanned");
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ADMIN_ROLES.includes(ctx.user.role)) {
    throw appError("FORBIDDEN", "unauthorized");
  }
  return next({ ctx });
});

/** Fine-grained guard for procedures restricted to specific roles. */
export function requireRoles(allowed: readonly UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowed.includes(ctx.user.role)) {
      throw appError("FORBIDDEN", "unauthorized");
    }
    return next({ ctx });
  });
}
