"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { useGetBanners } from "@/hooks/storefront/useGetBanners";

export function HeroSection() {
  const { t } = useLang();
  const reduceMotion = useReducedMotion();
  const { data: banners } = useGetBanners("hero");
  const banner = banners?.[0];

  return (
    <section className="relative isolate flex min-h-[70dvh] items-center overflow-hidden bg-primary text-text-inverse">
      {/* Background image sits behind a gradient scrim for legibility */}
      {/* Crop is chosen by VIEWPORT, not language: imageUrlMobile is the tall
          variant, so keying it off locale gave Arabic desktop visitors the
          mobile crop and English mobile visitors the wide one. */}
      {banner ? (
        <>
          {banner.imageUrlMobile ? (
            <Image
              src={banner.imageUrlMobile}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover opacity-60 sm:hidden"
            />
          ) : null}
          <Image
            src={banner.imageUrlDesktop}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`-z-10 object-cover opacity-60 ${banner.imageUrlMobile ? "hidden sm:block" : ""}`}
          />
        </>
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-scrim/60 via-scrim/20 to-transparent" />

      <div className="content-shell flex w-full flex-1 items-center py-24">
        <motion.div
          className="flex max-w-2xl flex-col gap-5"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="font-semibold" style={{ fontSize: "var(--text-hero)", lineHeight: 1.1 }}>
            {t.home.heroTitle}
          </h1>
          <p className="max-w-xl text-base text-on-media/85 sm:text-lg">{t.home.heroSubtitle}</p>
          <div>
            <Link href={banner?.linkUrl ?? "/products"}>
              <Button variant="accent" size="lg">
                {t.home.shopNow}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
