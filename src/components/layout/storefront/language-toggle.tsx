"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import type { Locale } from "@/types/shared";

export function LanguageToggle() {
  const { locale, setLocale } = useLang();
  const router = useRouter();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    // Server components (html lang/dir, metadata) re-render from the cookie
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => switchLocale(locale === "ar" ? "en" : "ar")}
      className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-text-secondary hover:text-text-primary"
      aria-label="switch language"
    >
      <Languages aria-hidden className="size-5" />
      {locale === "ar" ? "EN" : "ع"}
    </button>
  );
}
