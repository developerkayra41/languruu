import type { MetadataRoute } from "next";
import { LANDING_URLS, SITE_URL } from "./lib/seo";

const LAST_MODIFIED = new Date("2026-08-20");

const landingLanguages = {
  tr: LANDING_URLS.tr,
  en: LANDING_URLS.en,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: LANDING_URLS.tr,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: landingLanguages },
    },
    {
      url: LANDING_URLS.en,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: landingLanguages },
    },
    { url: `${SITE_URL}/privacy`, lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.3 },
  ];
}
