import { getTranslations } from "next-intl/server";
import { logout } from "@/app/(dashboard)/actions";

export default async function SuspendedPage() {
  const t = await getTranslations("suspended");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
          <i className="fas fa-ban text-2xl"></i>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-6">{t("text")}</p>
        <form action={logout}>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-[1.02]"
          >
            {t("logout")}
          </button>
        </form>
      </div>
    </div>
  );
}
