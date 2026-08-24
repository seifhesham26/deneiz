"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBanners } from "@/hooks/storefront/useGetBanners";

export function HeroSection() {
  const { locale, t } = useLang();
  const { data: banners, isLoading } = useGetBanners("hero");
  const banner = banners?.[0];

  return (
    <section className="relative isolate flex min-h-[70dvh] items-center overflow-hidden bg-primary text-text-inverse">
      {/* Background image sits behind a gradient scrim for legibility */}
      {banner ? (
        <Image
          src={locale === "ar" && banner.imageUrlMobile ? banner.imageUrlMobile : banner.imageUrlDesktop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-60"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <div className="content-shell section-shell w-full">
        <motion.div
          className="flex max-w-2xl flex-col gap-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="font-semibold" style={{ fontSize: "var(--text-hero)", lineHeight: 1.1 }}>
            {t.home.heroTitle}
          </h1>
          <p className="max-w-xl text-base text-white/85 sm:text-lg">{t.home.heroSubtitle}</p>
          <div>
            <Link href="/products">
              <Button variant="accent" size="lg">
                {t.home.shopNow}
              </Button>
            </Link>
          </div>
        </motion.div>

        {isLoading ? <Skeleton className="mt-8 h-4 w-40" /> : null}
      </div>
    </section>
  );
}
