import { Locale } from "@/app/i18n/locales";

export const SITE_URL = "https://www.languruu.com";

export const LANDING_URLS: Record<Locale, string> = {
  tr: SITE_URL,
  en: `${SITE_URL}/en`,
};

export function landingAlternates(locale: Locale) {
  return {
    canonical: LANDING_URLS[locale],
    languages: {
      tr: LANDING_URLS.tr,
      en: LANDING_URLS.en,
      "x-default": LANDING_URLS.en,
    },
  };
}

export function landingJsonLd(locale: Locale, name: string, description: string) {
  const url = LANDING_URLS[locale];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Languruu",
      alternateName: ["Languruu App", "Languruu Kelime"],
      url: SITE_URL,
      inLanguage: ["tr", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url,
      description,
      inLanguage: locale,
      offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
    },
  ];
}

export function blogListUrl(locale: Locale): string {
  return locale === "en" ? `${SITE_URL}/en/blog` : `${SITE_URL}/blog`;
}

export function blogPostUrl(locale: Locale, slug: string): string {
  return `${blogListUrl(locale)}/${slug}`;
}

export function articleJsonLd(params: {
  locale: Locale;
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: params.title,
    description: params.description,
    inLanguage: params.locale,
    datePublished: params.publishedAt,
    dateModified: params.updatedAt ?? params.publishedAt,
    mainEntityOfPage: blogPostUrl(params.locale, params.slug),
    author: { "@type": "Organization", name: "Languruu", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Languruu", url: SITE_URL },
  };
}
