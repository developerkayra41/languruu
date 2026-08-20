import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LandingPage from "../components/landing/LandingPage";
import { landingAlternates } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "landing" });

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: landingAlternates("en"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      locale: "en_US",
    },
  };
}

export default function EnglishHome() {
  return <LandingPage />;
}
