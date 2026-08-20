import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale } from "@/app/i18n/locales";
import { landingJsonLd } from "@/app/lib/seo";
import LandingClient from "./LandingClient";

export default async function LandingPage() {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "landing" });
  const isLoggedIn = !!(await cookies()).get("access_token")?.value;
  const jsonLd = landingJsonLd(locale, t("metaTitle"), t("metaDescription"));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient isLoggedIn={isLoggedIn} locale={locale} />
    </>
  );
}
