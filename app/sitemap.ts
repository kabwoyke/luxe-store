import type { MetadataRoute } from "next";
import { getAllProducts, getCollections } from "@/lib/catalog";
import { NAV_LINKS } from "@/lib/nav";
import { siteUrl } from "@/lib/site";

const STATIC_PAGES = ["/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, collections] = await Promise.all([getAllProducts(), getCollections()]);

  const categoryPages = NAV_LINKS.filter((l) => l.href.startsWith("/categories/")).map((l) => l.href);
  const collectionPages = collections.map((c) => `/collections/${c.slug}`);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categoryPages.map((path) => ({ url: `${base}${path}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...collectionPages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: `${base}/products/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...STATIC_PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
