"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Dictionary } from "@/lib/dictionary";
import { LOCALE_COOKIE } from "@/lib/constants";
import type { Locale, TextDirection } from "@/types/shared";

interface LangContextValue {
  locale: Locale;
  dir: TextDirection;
  t: Dictionary;
  setLocale: (next: Locale) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

interface LangProviderProps {
  initialLocale: Locale;
  children: React.ReactNode;
}

/**
 * The server renders <html lang dir> from the locale cookie so SSR output and
 * client markup always agree; switching locales writes the cookie and lets the
 * router refresh re-render the tree.
 */
export function LangProvider({ initialLocale, children }: LangProviderProps) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LangContextValue>(
    () => ({
      locale: initialLocale,
      dir: initialLocale === "ar" ? "rtl" : "ltr",
      t: getDictionary(initialLocale),
      setLocale,
    }),
    [initialLocale, setLocale],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used inside LangProvider");
  }
  return context;
}
