import Link from "next/link";
import { getTranslations } from "next-intl/server";
import UnsubscribeClient from "./UnsubscribeClient";

export async function generateMetadata() {
  const t = await getTranslations("unsubscribe");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const t = await getTranslations("unsubscribe");
  const { t: token } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {token ? (
        <UnsubscribeClient token={token} />
      ) : (
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
            <i className="fas fa-triangle-exclamation text-2xl"></i>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">{t("errorTitle")}</h1>
          <p className="text-gray-500 mb-6">{t("errorText")}</p>
          <Link href="/" className="text-purple-600 hover:underline text-sm">{t("backHome")}</Link>
        </div>
      )}
    </div>
  );
}
