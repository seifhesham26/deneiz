"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div
        className="content-shell grid gap-10 px-4 py-12"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
      >
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold">{t.common.storeName}</span>
          <p className="max-w-xs text-sm text-text-secondary">{t.footer.about}</p>
        </div>

        <nav aria-label={t.footer.shopLinks} className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{t.footer.shopLinks}</span>
          <Link href="/products" className="text-text-secondary hover:text-text-primary">
            {t.nav.products}
          </Link>
          <Link href="/wishlist" className="text-text-secondary hover:text-text-primary">
            {t.nav.wishlist}
          </Link>
          <Link href="/account" className="text-text-secondary hover:text-text-primary">
            {t.nav.account}
          </Link>
        </nav>

        <nav aria-label={t.footer.supportLinks} className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{t.footer.supportLinks}</span>
          <span className="text-text-secondary">{t.footer.faq}</span>
          <span className="text-text-secondary">{t.footer.shippingReturns}</span>
          <span className="text-text-secondary">{t.footer.privacy}</span>
        </nav>

        <div className="flex flex-col gap-3 text-sm">
          <span className="font-medium">{t.footer.contactUs}</span>
          <span className="flex items-center gap-2 text-text-secondary">
            <Mail aria-hidden className="size-4" /> support@deneiz.com
          </span>
          <span className="flex items-center gap-2 text-text-secondary" dir="ltr">
            <Phone aria-hidden className="size-4" /> +966 55 000 0000
          </span>
          <span className="flex items-center gap-2 text-text-secondary">
            {t.footer.followUs}: @deneiz
          </span>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-text-muted">
        {t.footer.rights(year)}
      </div>
    </footer>
  );
}
