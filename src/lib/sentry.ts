/**
 * PROTOTYPE: Sentry SDK wiring is stubbed until a DSN is provisioned.
 * The call sites already funnel unexpected errors here, so enabling Sentry
 * later means swapping this body for @sentry/nextjs initialization only.
 */
import { env } from "@/env";

export function captureException(error: unknown): void {
  if (!env.sentryDsn) {
    console.error("[sentry-stub]", error);
    return;
  }
  // PROTOTYPE: forward to real Sentry transport once DSN exists
  console.error("[sentry-stub]", error);
}
