import AuthHero from "@/app/components/auth/AuthHero";
import RegisterForm from "./RegisterForm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");
  const th = await getTranslations("auth.hero");

  return (
    <div className="min-h-screen flex bg-white">
      <AuthHero
        headline={th("registerHeadline")}
        subtext={th("registerSubtext")}
      />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center mb-8 text-purple-700">
            <i className="fas fa-graduation-cap mr-2 text-2xl"></i>
            <span className="text-2xl font-bold">Languruu</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("title")}</h1>
          <p className="text-gray-500 text-sm mb-8">{t("subtitle")}</p>

          <RegisterForm />

          <p className="text-sm text-gray-500 mt-6 text-center">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-purple-600 font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
