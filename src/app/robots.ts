import type { MetadataRoute } from "next";
import { SITE_URL, ROBOTS_DISALLOWED_PATHS, absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";

  // Zabezpieczenie przed indeksowaniem środowisk testowych[cite: 1].
  if (!isProduction) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...ROBOTS_DISALLOWED_PATHS],
        crawlDelay: 1, // Ochrona wydajnościowa serwera przed agresywnym crawlowaniem[cite: 1].
      },
      {
        // Oszczędzanie transferu odrzucając zasobożerne boty analityczne[cite: 1].
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot"],
        disallow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [...ROBOTS_DISALLOWED_PATHS],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
