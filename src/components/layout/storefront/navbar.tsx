"use client";

import Link from "next/link";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { LanguageToggle } from "./language-toggle";
import { useCartStore, selectCartItemCount } from "@/store/cart.store";
import { useUiStore } from "@/store/ui.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";

export function Navbar() {
  const { t } = useLang();
  const openMobileMenu = useUiStore((state) => state.setMobileMenuOpen);
  const openCartDrawer = useUiStore((state) => state.openCartDrawer);
  const itemCount = useCartStore(selectCartItemCount);
  const isHydrated = useIsHydrated();

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: t.nav.products },
    { href: "/account", label: t.nav.account },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="content-shell flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t.common.menu}
            onClick={() => openMobileMenu(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface md:hidden"
          >
            <Menu aria-hidden className="size-6" />
          </button>

          <Link href="/" className="text-xl font-semibold tracking-wide">
            {t.common.storeName}
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex" aria-label="primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-text-secondary hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <LanguageToggle />

          <Link
            href="/wishlist"
            aria-label={t.wishlist.title}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
          >
            <Heart aria-hidden className="size-5" />
          </Link>

          <Link
            href="/account"
            aria-label={t.account.title}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
          >
            <User aria-hidden className="size-5" />
          </Link>

          <button
            type="button"
            aria-label={t.cart.title}
            onClick={openCartDrawer}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
          >
            <ShoppingBag aria-hidden className="size-5" />
            {isHydrated && itemCount > 0 ? (
              <span className="absolute end-1 top-1 flex size-4.5 items-center justify-center rounded-full bg-accent p-0.5 text-[0.65rem] font-semibold text-text-inverse">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
