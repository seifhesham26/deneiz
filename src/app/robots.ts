import type { MetadataRoute } from "next";
import { env } from "@/env";

/** Cart, checkout and account are per-visitor and must never be indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cart", "/checkout", "/account", "/api/"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
