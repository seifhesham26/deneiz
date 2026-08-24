import type { MetadataRoute } from "next";
import { env } from "@/env";
import { listPublishedProducts } from "@/server/products/products.db";
import { listCategories } from "@/server/categories/categories.db";
import { MAX_PAGE_SIZE } from "@/lib/constants";

/** Published products and active categories only — drafts must not leak. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  ];

  // The database may be unreachable during a build (same reason
  // generateMetadata guards) — a sitemap is not worth failing the build over
  try {
    const [products, categories] = await Promise.all([
      listPublishedProducts({ page: 1, pageSize: MAX_PAGE_SIZE, sort: "newest" }),
      listCategories({ activeOnly: true }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${env.siteUrl}/products?categorySlug=${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.items.map((product) => ({
        url: `${env.siteUrl}/products/${product.slug}`,
        lastModified: product.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
