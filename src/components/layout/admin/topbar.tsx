"use client";

import { Menu } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { LanguageToggle } from "@/components/layout/storefront/language-toggle";

export function Topbar() {
  const { t } = useLang();

  function toggleSidebar(event: React.MouseEvent<HTMLButtonElement>) {
    // The sidebar is CSS-hidden below lg; toggling the drawer class keeps
    // this dependency-free without duplicating nav state
    const sidebar = document.querySelector("[data-admin-sidebar]");
    sidebar?.classList.toggle("hidden");
    void event;
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface-raised px-4">
      <button
        type="button"
        aria-label={t.common.menu}
        onClick={toggleSidebar}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </button>

      <div className="flex items-center gap-1">
        <LanguageToggle />
      </div>
    </header>
  );
}
