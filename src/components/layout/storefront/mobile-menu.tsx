"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { useUiStore } from "@/store/ui.store";

export function MobileMenu() {
  const { t } = useLang();
  const pathname = usePathname();
  const isOpen = useUiStore((state) => state.isMobileMenuOpen);
  const setOpen = useUiStore((state) => state.setMobileMenuOpen);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: t.nav.products },
    { href: "/wishlist", label: t.nav.wishlist },
    { href: "/account", label: t.nav.account },
  ];

  function close() {
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col gap-2 bg-background p-5 pt-6 md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
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

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={pathname === link.href ? "page" : undefined}
                className="min-h-11 rounded-lg px-3 text-base leading-[2.75rem] hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
