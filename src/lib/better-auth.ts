import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { env } from "@/env";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: {
      enabled: true,
      // PROTOTYPE: verification is deferred — flip this once Resend sends
      // verification emails, then add the verify-callback route
      requireEmailVerification: false,
    },
    secret: env.betterAuthSecret,
    // Trailing slashes make Better Auth build URLs like /api/auth with "//"
    baseURL: env.betterAuthUrl.replace(/\/+$/, ""),
    plugins: [
      dash({
        apiKey: env.betterAuthApiKey,
        // Activity tracking writes lastActiveAt on the user — keep it off
        // until that column exists in the schema
        activityTracking: { enabled: false },
      }),
      // Cookie integration must stay last or Set-Cookie headers get dropped
      nextCookies(),
    ],
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "customer", input: false },
        isBanned: { type: "boolean", defaultValue: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // First-admin bootstrap: the configured email registers as
            // super_admin with its own chosen password — no SQL handouts
            const bootstrapEmail = env.adminBootstrapEmail?.toLowerCase();
            if (bootstrapEmail && user.email.toLowerCase() === bootstrapEmail) {
              // One-shot: without this the configured address stays a
              // self-service super_admin registration for as long as the env
              // var is set — and email verification is off, so registering it
              // proves nothing about owning it
              const [existingSuperAdmin] = await getDb()
                .select({ id: users.id })
                .from(users)
                .where(eq(users.role, "super_admin"))
                .limit(1);
              if (existingSuperAdmin) return { data: user };
              return { data: { ...user, role: "super_admin" } };
            }
            return { data: user };
          },
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let cachedAuth: AuthInstance | undefined;

/**
 * Lazy like getDb() — importing this module during `next build` must not
 * demand BETTER_AUTH_SECRET or a reachable database.
 */
export function getAuth(): AuthInstance {
  cachedAuth ??= createAuth();
  return cachedAuth;
}
