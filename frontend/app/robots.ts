import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/study", "/words", "/add", "/groups", "/marketplace", "/settings", "/profile", "/top-performers", "/verify-email", "/reset-password"],
    },
    sitemap: "https://www.languruu.com/sitemap.xml",
  };
}