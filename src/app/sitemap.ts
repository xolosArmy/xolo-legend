import type { MetadataRoute } from "next";
import { loadRegistry, REGISTRY_REVALIDATE_SECONDS } from "@/lib/registry";

const SITE_URL = "https://marketplace.xolosarmy.xyz";

export const revalidate = REGISTRY_REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await loadRegistry();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${SITE_URL}/how-to-buy`,
      changeFrequency: "monthly",
      priority: 0.6
    }
  ];

  const listingRoutes: MetadataRoute.Sitemap = listings
    .filter((listing) => listing.id)
    .map((listing) => ({
      url: `${SITE_URL}/item/${listing.id}`,
      lastModified: new Date(listing.createdAt),
      changeFrequency: "hourly" as const,
      priority: 0.7
    }));

  return [...staticRoutes, ...listingRoutes];
}
