import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
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
    baseURL: env.betterAuthUrl,
    plugins: [nextCookies()],
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
