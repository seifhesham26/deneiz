import { CategoriesGrid } from "@/components/storefront/home/categories-grid";
import { FeaturedProducts } from "@/components/storefront/home/featured-products";
import { HeroSection } from "@/components/storefront/home/hero-section";
import { PromoBanner } from "@/components/storefront/home/promo-banner";

export default function StorefrontHomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <CategoriesGrid />
      <PromoBanner />
    </>
  );
}
