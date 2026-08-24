/**
 * Typed environment access. Application code must read configuration through
 * this module — direct process.env usage elsewhere is forbidden because it is
 * untyped and easy to misspell silently.
 *
 * Values are exposed as lazy getters so that missing optional services never
 * break module import; they only surface when actually used.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function optional(key: string): string | undefined {
  return process.env[key];
}

export const env = {
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },

  get betterAuthSecret(): string {
    return required("BETTER_AUTH_SECRET");
  },

  get betterAuthUrl(): string {
    return optional("BETTER_AUTH_URL") ?? "http://localhost:3000";
  },

  /** Better Auth dashboard (dash plugin) key — absent means the dashboard integration is off. */
  get betterAuthApiKey(): string | undefined {
    return optional("BETTER_AUTH_API_KEY");
  },

  /** Absent key means transactional emails are skipped (logged instead). */
  get resendApiKey(): string | undefined {
    return optional("RESEND_API_KEY");
  },

  /** Absent DSN means Sentry is disabled. */
  get sentryDsn(): string | undefined {
    return optional("SENTRY_DSN");
  },

  /** Absent Upstash credentials mean rate limiting falls back to in-memory. */
  get upstashRedisRestUrl(): string | undefined {
    return optional("UPSTASH_REDIS_REST_URL");
  },

  get upstashRedisRestToken(): string | undefined {
    return optional("UPSTASH_REDIS_REST_TOKEN");
  },

  /** Absent key means PostHog analytics events are dropped. */
  get posthogKey(): string | undefined {
    return optional("NEXT_PUBLIC_POSTHOG_KEY");
  },

  get posthogHost(): string {
    return optional("NEXT_PUBLIC_POSTHOG_HOST") ?? "https://us.i.posthog.com";
  },
} as const;
