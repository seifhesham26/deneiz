import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { getDb } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { env } from "@/env";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: { enabled: true },
    secret: env.betterAuthSecret,
    // Trailing slashes make Better Auth build URLs like /api/auth with "//"
    baseURL: env.betterAuthUrl.replace(/\/+$/, ""),
    plugins: [
      nextCookies(),
      dash({
        apiKey: env.betterAuthApiKey,
        // Activity tracking writes lastActiveAt on the user — keep it off
        // until that column exists in the schema
        activityTracking: { enabled: false },
      }),
    ],
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "customer", input: false },
        isBanned: { type: "boolean", defaultValue: false, input: false },
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
