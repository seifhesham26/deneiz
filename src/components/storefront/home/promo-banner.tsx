"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { useGetBanners } from "@/hooks/storefront/useGetBanners";

export function PromoBanner() {
  const { locale, t } = useLang();
  const { data: banners } = useGetBanners("promo");
  const banner = banners?.[0];

  return (
    <section className="section-shell">
      <motion.div
        className="content-shell relative isolate overflow-hidden rounded-3xl bg-accent text-text-inverse"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
      >
        {banner ? (
          <Image
            src={locale === "ar" && banner.imageUrlMobile ? banner.imageUrlMobile : banner.imageUrlDesktop}
            alt=""
            fill
            sizes="100vw"
            className="-z-10 object-cover opacity-40"
          />
        ) : null}

        <div
          className="flex flex-col items-start gap-4 p-8 sm:p-14"
          style={{ paddingBlock: "var(--spacing-section-y)", paddingInline: "var(--spacing-section-x)" }}
        >
          <h2 className="max-w-lg text-3xl font-semibold sm:text-4xl">{t.home.promoTitle}</h2>
          <p className="max-w-md text-sm text-white/85 sm:text-base">{t.home.promoSubtitle}</p>

          <Link href={banner?.linkUrl ?? "/products"}>
            <Button variant="primary" size="lg" className="bg-background text-text-primary hover:bg-surface-raised">
              {t.home.promoCta}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
