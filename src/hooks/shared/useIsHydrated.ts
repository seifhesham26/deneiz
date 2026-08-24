"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True once the component has mounted on the client. Persisted Zustand stores
 * hydrate after SSR, so anything derived from them (cart badge counts) must
 * render only post-mount to avoid hydration mismatches.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
