import type { MetadataRoute } from "next";

const SITE_URL = "https://marketplace.xolosarmy.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/item/", "/faq", "/how-to-buy"],
        disallow: [
          "/api/",
          "/connected",
          "/create",
          "/tx",
          "/wp-admin",
          "/xmlrpc.php",
          "/cgi-bin/",
          "/login",
          "/admin",
          "/*.php"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
