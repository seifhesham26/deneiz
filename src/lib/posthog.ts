/**
 * PROTOTYPE: PostHog provider is stubbed until a project key is provisioned.
 * track() is the single funnel point — swap its body for real PostHog calls
 * without touching component code.
 */
import { env } from "@/env";

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!env.posthogKey) return;
  // PROTOTYPE: forward to posthog-js once key exists
  console.debug(`[posthog-stub] ${event}`, properties);
}
