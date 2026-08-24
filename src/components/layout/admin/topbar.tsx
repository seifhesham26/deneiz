"use client";

import Link from "next/link";
import { ExternalLink, Menu } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { LanguageToggle } from "@/components/layout/storefront/language-toggle";
import { ThemeToggle } from "@/components/layout/storefront/theme-toggle";
import { Breadcrumb } from "./breadcrumb";
import { useUiStore } from "@/store/ui.store";

export function Topbar() {
  const { t } = useLang();
  const setAdminSidebarOpen = useUiStore((state) => state.setAdminSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface-raised px-4">
      <button
        type="button"
        aria-label={t.common.menu}
        onClick={() => setAdminSidebarOpen(true)}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </button>

      {/* Breadcrumb owns the flexible middle zone so long paths truncate, not the actions */}
      <div className="min-w-0 flex-1">
        <Breadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ThemeToggle />
        <LanguageToggle />
        <Link
          href="/"
          className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          <ExternalLink aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t.nav.viewStore}</span>
        </Link>
      </div>
    </header>
  );
}
