"use client";

import Link from "next/link";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { NavbarSearch } from "./navbar-search";
import { useCartStore, selectCartItemCount } from "@/store/cart.store";
import { useUiStore } from "@/store/ui.store";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";
import { cn } from "@/lib/cn";

const ADMIN_ROLES = ["super_admin", "manager", "staff"];

export function Navbar() {
  const { t } = useLang();
  const openMobileMenu = useUiStore((state) => state.setMobileMenuOpen);
  const openCartDrawer = useUiStore((state) => state.openCartDrawer);
  const itemCount = useCartStore(selectCartItemCount);
  const isHydrated = useIsHydrated();
  // Cached session query — also consumed by the account page and admin guard
  const { user } = useGetSessionUser();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: t.nav.products },
    ...(isAdmin ? [{ href: "/admin", label: t.nav.adminPanel }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      {/* Three-zone desktop layout: links · search · brand+actions */}
      <div className="content-shell hidden h-[4.5rem] items-center gap-8 lg:flex">
        <nav className="flex items-center gap-7" aria-label="primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                link.href === "/admin"
                  ? "text-accent hover:opacity-80"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 justify-center">
          <NavbarSearch />
        </div>

        <Link href="/" className="text-xl font-semibold tracking-wide">
          {t.common.storeName}
        </Link>

        <div className="ms-auto flex items-center gap-0.5">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/wishlist"
            aria-label={t.wishlist.title}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
          >
            <Heart aria-hidden className="size-5" />
          </Link>
          <Link
            href="/account"
            aria-label={t.account.title}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
          >
            <User aria-hidden className="size-5" />
          </Link>
          <button
            type="button"
            aria-label={t.cart.title}
            onClick={openCartDrawer}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
          >
            <ShoppingBag aria-hidden className="size-5" />
            {isHydrated && itemCount > 0 ? (
              <span className="absolute end-0.5 top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent p-0.5 text-[0.6rem] font-semibold text-text-inverse">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Compact mobile/tablet bar */}
      <div className="content-shell flex h-16 items-center justify-between gap-2 lg:hidden">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t.common.menu}
            onClick={() => openMobileMenu(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
          >
            <Menu aria-hidden className="size-6" />
          </button>
          <Link href="/" className="text-lg font-semibold tracking-wide">
            {t.common.storeName}
          </Link>
        </div>

        <NavbarSearch />

        <div className="flex items-center">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            aria-label={t.cart.title}
            onClick={openCartDrawer}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
          >
            <ShoppingBag aria-hidden className="size-5" />
            {isHydrated && itemCount > 0 ? (
              <span className="absolute end-0.5 top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent p-0.5 text-[0.6rem] font-semibold text-text-inverse">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
