import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, Locale, LOCALE_HEADER } from "./locales";

async function loadMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Cagiran taraf dili acikca verdiyse (ornegin getTranslations({ locale }))
  // ona uyulur. Bu olmadan acik dil sessizce yok sayiliyordu.
  const requested = await requestLocale;
  if (isLocale(requested)) {
    return { locale: requested, messages: await loadMessages(requested) };
  }

  const headerList = await headers();

  // URL dili belirler: /en ingilizce, / ve yasal sayfalar turkce.
  // Middleware bu basligi yaziyor; cerezden once gelir ki Google her adresi
  // sabit tek bir dilde gorsun.
  const forced = headerList.get(LOCALE_HEADER);
  if (isLocale(forced)) {
    return { locale: forced, messages: await loadMessages(forced) };
  }

  const fromCookie = (await cookies()).get("locale")?.value;
  if (isLocale(fromCookie)) {
    return { locale: fromCookie, messages: await loadMessages(fromCookie) };
  }

  const country = headerList.get("x-vercel-ip-country");
  const locale: Locale = country === "TR" ? "tr" : "en";
  return { locale, messages: await loadMessages(locale) };
});

export { DEFAULT_LOCALE };
