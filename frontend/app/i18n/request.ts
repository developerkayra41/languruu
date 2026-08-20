import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, Locale, LOCALE_HEADER } from "./locales";

export default getRequestConfig(async () => {
  const headerList = await headers();

  // URL dili belirler: /en ingilizce, / ve yasal sayfalar turkce.
  // Middleware bu basligi yaziyor; cerezden once gelir ki Google her adresi
  // sabit tek bir dilde gorsun.
  const forced = headerList.get(LOCALE_HEADER);
  let locale: Locale | undefined = isLocale(forced) ? forced : undefined;

  if (!locale) {
    const fromCookie = (await cookies()).get("locale")?.value;
    if (isLocale(fromCookie)) locale = fromCookie;
  }

  if (!locale) {
    const country = headerList.get("x-vercel-ip-country");
    locale = country === "TR" ? "tr" : "en";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

export { DEFAULT_LOCALE };
