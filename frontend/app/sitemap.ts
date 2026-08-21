import type { MetadataRoute } from "next";
import { POSTS } from "./blog/posts";
import { LANDING_URLS, SITE_URL, blogListUrl, blogPostUrl } from "./lib/seo";

const LAST_MODIFIED = new Date("2026-08-21");

const landingLanguages = {
  tr: LANDING_URLS.tr,
  en: LANDING_URLS.en,
};

const blogLanguages = {
  tr: blogListUrl("tr"),
  en: blogListUrl("en"),
};

export default function sitemap(): MetadataRoute.Sitemap {
  const posts: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: blogPostUrl(post.locale, post.slug),
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

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
    {
      url: blogListUrl("tr"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: blogLanguages },
    },
    {
      url: blogListUrl("en"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: blogLanguages },
    },
    ...posts,
    { url: `${SITE_URL}/privacy`, lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.3 },
  ];
}
