"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/storefront/reveal";
import { useGetBanners } from "@/hooks/storefront/useGetBanners";

export function PromoBanner() {
  const { t } = useLang();
  const { data: banners } = useGetBanners("promo");
  const banner = banners?.[0];

  return (
    <section className="section-y">
      <Reveal className="content-shell">
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary text-text-inverse">
          {/* Crop chosen by viewport, not language — see hero-section.tsx */}
          {banner ? (
            <>
              {banner.imageUrlMobile ? (
                <Image
                  src={banner.imageUrlMobile}
                  alt=""
                  fill
                  sizes="100vw"
                  className="-z-10 object-cover opacity-40 sm:hidden"
                />
              ) : null}
              <Image
                src={banner.imageUrlDesktop}
                alt=""
                fill
                sizes="100vw"
                className={`-z-10 object-cover opacity-40 ${banner.imageUrlMobile ? "hidden sm:block" : ""}`}
              />
            </>
          ) : null}

          <div className="flex flex-col items-start gap-5 px-8 py-16 sm:px-14 sm:py-24">
            <span className="eyebrow text-on-media/70">{t.home.newArrivals}</span>
            <h2 className="max-w-lg text-3xl font-semibold sm:text-4xl">{t.home.promoTitle}</h2>
            <p className="max-w-md text-sm text-on-media/85 sm:text-base">{t.home.promoSubtitle}</p>

            <Link href={banner?.linkUrl ?? "/products"} className="pt-2">
              <Button variant="accent" size="lg">
                {t.home.promoCta}
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
