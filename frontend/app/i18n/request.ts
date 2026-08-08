import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get("locale")?.value;

  // Cookie yoksa ülkeye göre belirle: Türkiye → tr, diğer herkes → en
  if (locale !== "tr" && locale !== "en") {
    const country = (await headers()).get("x-vercel-ip-country");
    locale = country === "TR" ? "tr" : "en";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
