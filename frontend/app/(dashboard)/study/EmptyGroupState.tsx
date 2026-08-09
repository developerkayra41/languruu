import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function EmptyGroupState() {
  const t = await getTranslations("emptyStates");
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
        <i className="fas fa-book text-2xl"></i>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {t("noGroupsTitle")}
      </h2>
      <p className="text-gray-500 mb-6">{t("noGroupsText")}</p>
      <Link
        href="/groups"
        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-[1.02] inline-block"
      >
        {t("goToGroups")}
      </Link>
    </div>
  );
}