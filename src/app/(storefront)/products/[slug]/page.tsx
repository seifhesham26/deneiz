import type { Metadata } from "next";
import { ProductDetailLoader } from "./product-detail-loader";
import { getPublishedProductBySlug } from "@/server/products/products.db";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  // DB may be unreachable during builds — fall back to a generic title
  try {
    const product = await getPublishedProductBySlug(slug);
    if (product) {
      return {
        title: product.metaTitle ?? product.nameEn,
        description: product.metaDescription ?? product.descriptionEn ?? undefined,
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
