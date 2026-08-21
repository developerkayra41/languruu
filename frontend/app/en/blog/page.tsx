import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BlogList from "@/app/components/blog/BlogList";
import { blogListUrl } from "@/app/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "blog" });
  return {
    title: { absolute: `${t("title")} | Languruu` },
    description: t("subtitle"),
    alternates: {
      canonical: blogListUrl("en"),
      languages: {
        tr: blogListUrl("tr"),
        en: blogListUrl("en"),
        "x-default": blogListUrl("en"),
      },
    },
  };
}

export default function EnglishBlogIndexPage() {
  return <BlogList locale="en" />;
}
