import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale } from "./i18n/locales";
import LandingPage from "./components/landing/LandingPage";
import { landingAlternates } from "./lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: landingAlternates("tr"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
  };
}

export default function Home() {
  return <LandingPage />;
}
