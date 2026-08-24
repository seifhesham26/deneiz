"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { useUiStore } from "@/store/ui.store";
import { useBodyScrollLock } from "@/hooks/shared/useBodyScrollLock";
import { useMediaQuery } from "@/hooks/shared/useMediaQuery";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const reduceMotion = useReducedMotion();
  const { locale, t } = useLang();
  const pathname = usePathname();
  const isOpen = useUiStore((state) => state.isAdminSidebarOpen);
  const setOpen = useUiStore((state) => state.setAdminSidebarOpen);

  // Close the mobile drawer whenever navigation happens
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useBodyScrollLock(isOpen);

  // The drawer only exists below lg — close it if the viewport grows so the
  // scroll lock can never outlive its trigger
  const isDesktop = useMediaQuery("(min-width: 64rem)");
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop, setOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  const navItems = [
    { href: "/admin", label: t.admin.dashboard, icon: LayoutDashboard },
    { href: "/admin/products", label: t.admin.products, icon: Package },
    { href: "/admin/categories", label: t.admin.categories, icon: ClipboardList },
    { href: "/admin/banners", label: t.admin.banners, icon: ImageIcon },
    { href: "/admin/orders", label: t.admin.orders, icon: Boxes },
    { href: "/admin/inventory", label: t.admin.inventory, icon: Package },
    { href: "/admin/warehouse", label: t.admin.warehouse, icon: Warehouse },
    { href: "/admin/reviews", label: t.admin.reviews, icon: MessageSquare },
    { href: "/admin/customers", label: t.admin.customers, icon: Users },
    { href: "/admin/analytics", label: t.admin.analytics, icon: BarChart3 },
    { href: "/admin/settings", label: t.admin.settings, icon: Settings },
  ];

  function renderNav() {
    return (
      <nav aria-label="admin" className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                isActive
                  ? "bg-admin-text/10 font-medium text-admin-text"
                  : "text-admin-text/70 hover:bg-admin-text/5 hover:text-admin-text",
              )}
            >
              <item.icon aria-hidden className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderFooter() {
    return (
      <div className="mt-auto px-2 pt-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 text-xs text-admin-text/60 transition-colors hover:text-admin-text"
        >
          <ExternalLink aria-hidden className="size-3.5" />
          {t.nav.viewStore}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop rail — persistent */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto bg-admin-sidebar p-4 text-admin-text lg:flex">
        <span className="mb-6 px-2 text-lg font-semibold tracking-wide">{t.admin.panelName}</span>
        {renderNav()}
        {renderFooter()}
      </aside>

      {/* Mobile drawer — state-driven, mirrors the storefront menu pattern */}
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-scrim/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t.admin.panelName}
              className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-admin-sidebar p-4 pt-5 text-admin-text lg:hidden"
              initial={{ x: locale === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: locale === "ar" ? "100%" : "-100%" }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-wide">{t.admin.panelName}</span>
                <button
                  type="button"
                  aria-label={t.common.close}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-admin-text/70 hover:bg-admin-text/5 hover:text-admin-text"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              {renderNav()}
              {renderFooter()}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
