import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/constants";
import { ProductDetailLoader } from "./product-detail-loader";
import { getPublishedProductBySlug } from "@/server/products/products.db";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // The document language is decided by the same cookie the root layout reads,
  // so metadata must follow it rather than always emitting English
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : DEFAULT_LOCALE;

  // DB may be unreachable during builds — fall back to a generic title
  try {
    const product = await getPublishedProductBySlug(slug);
    if (product) {
      const name = locale === "ar" ? product.nameAr : product.nameEn;
      const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
      return {
        title: product.metaTitle ?? name,
        description: product.metaDescription ?? description ?? undefined,
        alternates: { canonical: `/products/${product.slug}` },
        openGraph: {
          title: product.metaTitle ?? name,
          description: product.metaDescription ?? description ?? undefined,
          images: product.images[0]?.url ? [product.images[0].url] : undefined,
          type: "website",
        },
      };
    }
  } catch {
    // fall through to default metadata
  }

  return { title: "Product" };
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  return <ProductDetailLoader slug={slug} />;
}
