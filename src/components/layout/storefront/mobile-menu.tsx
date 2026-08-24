"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { useUiStore } from "@/store/ui.store";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";
import { useBodyScrollLock } from "@/hooks/shared/useBodyScrollLock";
import { useMediaQuery } from "@/hooks/shared/useMediaQuery";

const ADMIN_ROLES = ["super_admin", "manager", "staff"];

export function MobileMenu() {
  const reduceMotion = useReducedMotion();
  const { locale, t } = useLang();
  const pathname = usePathname();
  const isOpen = useUiStore((state) => state.isMobileMenuOpen);
  const setOpen = useUiStore((state) => state.setMobileMenuOpen);
  const { user } = useGetSessionUser();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));

  // The hamburger is visible below lg, so the drawer must be too
  useBodyScrollLock(isOpen);

  // Auto-close when the viewport grows past lg so a resize can't leave the
  // drawer mounted (and the page scroll-locked) with no toggle to reach it
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

  // Slide direction follows the drawer's logical start edge (left in LTR,
  // right in RTL) so it always enters from the side it is anchored to
  const isRtl = locale === "ar";
  const offscreenX = isRtl ? "100%" : "-100%";

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: t.nav.products },
    { href: "/wishlist", label: t.nav.wishlist },
    { href: "/account", label: t.nav.account },
    ...(isAdmin ? [{ href: "/admin", label: `★ ${t.nav.adminPanel}` }] : []),
  ];

  function close() {
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-scrim/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t.common.menu}
            className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col gap-2 overflow-y-auto bg-background p-5 pt-6 lg:hidden"
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">{t.common.storeName}</span>
              <button
                type="button"
                aria-label={t.common.close}
                onClick={close}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <nav aria-label="mobile" className="flex flex-col">
              {links.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    aria-current={isActive ? "page" : undefined}
                    className={`min-h-11 rounded-lg px-3 text-base leading-[2.75rem] transition-colors ${
                      isActive
                        ? "bg-surface font-medium text-text-primary"
                        : "hover:bg-surface"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
