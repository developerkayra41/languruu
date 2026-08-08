import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Logo from "@/app/components/ui/Logo";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-purple-600">
          <Logo className="w-8 h-8" />
          <span className="text-3xl font-bold">404</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-6">{t("text")}</p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-[1.02]"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
