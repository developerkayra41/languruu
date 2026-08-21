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

// Marka profilleri. SADECE gercekten var olan adresleri ekle.
// Olmayan bir adres Google icin olumsuz sinyaldir; bos birakmak daha iyidir.
// Yeni hesap actikca buraya bir satir eklemen yeterli.
export const SOCIAL_PROFILES: string[] = [
  "https://www.linkedin.com/company/languruu",
  "https://www.youtube.com/@languruu",
  "https://medium.com/@languruu",
  "https://www.reddit.com/user/languruu/"

];

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Languruu",
    alternateName: ["Languruu App", "Languruu Kelime"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.png`,
      width: 512,
      height: 512,
    },
    ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES } : {}),
  };
}

export function landingJsonLd(locale: Locale, name: string, description: string) {
  const url = LANDING_URLS[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Languruu",
        alternateName: ["Languruu App", "Languruu Kelime"],
        url: SITE_URL,
        inLanguage: ["tr", "en"],
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "WebApplication",
        name,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url,
        description,
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID },
        offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
      },
    ],
  };
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
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}
