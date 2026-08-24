"use client";

import { useEffect, useRef } from "react";

/**
 * Marks an element with data-scroll-visible when it enters the viewport once.
 * Pair with CSS transitions for lightweight reveal-on-scroll animations
 * without re-rendering the component tree.
 */
export function useScrollAnimation<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-scroll-visible", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, ...options },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return elementRef;
}
