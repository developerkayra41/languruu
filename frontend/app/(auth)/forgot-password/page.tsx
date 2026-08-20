import ForgotPasswordForm from "./ForgotPasswordForm";
import { getTranslations } from "next-intl/server";

export const metadata = {
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgot");
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("subtitle")}</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
