import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import LandingClient from "./components/landing/LandingClient";

export async function generateMetadata() {
  const t = await getTranslations("landing");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "https://www.languruu.com" },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Languruu",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: "https://www.languruu.com",
  description:
    "Yabancı kelime öğrenme uygulaması. Kendi kelime gruplarını oluştur, çalış ve paylaş.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
};

export default async function Home() {
  const isLoggedIn = !!(await cookies()).get("access_token")?.value;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient isLoggedIn={isLoggedIn} />
    </>
  );
}