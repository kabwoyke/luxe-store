import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or useless to search engines: accounts, checkout, orders, admin, APIs, results pages.
      disallow: ["/admin", "/api/", "/checkout", "/order/", "/profile", "/login", "/signup", "/search", "/wishlist"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
