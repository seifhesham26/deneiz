import type { MetadataRoute } from "next";
import { env } from "@/env";
import { listPublishedProductSlugs } from "@/server/products/products.db";
import { listCategories } from "@/server/categories/categories.db";

/** Published products and active categories only — drafts must not leak. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  ];

  // The database may be unreachable during a build (same reason
  // generateMetadata guards) — a sitemap is not worth failing the build over
  try {
    // Unpaginated on purpose: paging this at MAX_PAGE_SIZE silently capped the
    // sitemap at 48 products, so nothing past that was ever submitted for indexing
    const [products, categories] = await Promise.all([
      listPublishedProductSlugs(),
      listCategories({ activeOnly: true }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${env.siteUrl}/products?categorySlug=${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: `${env.siteUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
