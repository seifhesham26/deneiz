"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { cn } from "@/lib/cn";

const THEME_STORAGE_KEY = "deneiz-theme";

type Theme = "light" | "dark";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/** Writes the attribute pre-paint; kept in sync with the inline bootstrap in layout.tsx. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme(): Theme {
  const next = getSnapshot() === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
  return next;
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const isHydrated = useIsHydrated();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClick = useCallback(() => {
    // Attribute flips via the store-free helper so every mounted toggle stays
    // in sync through the storage/attribute read above
    toggleTheme();
    window.dispatchEvent(new Event("storage"));
  }, []);

  if (!isHydrated) {
    return <span className={cn("inline-block size-11", className)} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={theme === "dark" ? "light mode" : "dark mode"}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun aria-hidden className="size-5" />
      ) : (
        <Moon aria-hidden className="size-5" />
      )}
    </button>
  );
}
