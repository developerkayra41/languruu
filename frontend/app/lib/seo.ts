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
