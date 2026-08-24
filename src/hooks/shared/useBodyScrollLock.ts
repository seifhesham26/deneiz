"use client";

import { useEffect } from "react";

/** Shared across every overlay: a per-caller snapshot would let the first
 *  overlay to unmount restore scrolling while a second is still open. */
let lockCount = 0;
let previousOverflow = "";

/**
 * Locks body scrolling while `locked` is true — used by drawers and modals so
 * the page behind an overlay doesn't scroll. Reference-counted, so stacked
 * overlays only release the lock when the last one closes.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [locked]);
}
