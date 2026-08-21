import { getTranslations } from "next-intl/server";
import { OG_SIZE, renderOgCard } from "./lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Languruu";

export default async function OpengraphImage() {
  const t = await getTranslations({ locale: "tr", namespace: "landing" });
  return renderOgCard(t("badge"), t("metaTitle"));
}
