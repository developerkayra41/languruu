import ResetPasswordForm from "./ResetPasswordForm";
import { getTranslations } from "next-intl/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("auth.reset");
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("subtitle")}</p>
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </div>
  );
}
