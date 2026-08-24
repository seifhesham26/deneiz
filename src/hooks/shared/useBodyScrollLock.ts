import { useEffect } from "react";

/**
 * Locks body scrolling while `locked` is true — used by drawers and modals so
 * the page behind an overlay doesn't scroll. Restores the previous value on
 * cleanup, nesting safely when several overlays stack.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
