import AuthHero from "@/app/components/auth/AuthHero";
import LoginForm from "./LoginForm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: true },
};

export default async function LoginPage() {
  const t = await getTranslations("auth.login");
  const th = await getTranslations("auth.hero");

  return (
    <div className="min-h-screen flex bg-white">
      <AuthHero
        headline={th("loginHeadline")}
        subtext={th("loginSubtext")}
      />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center mb-8 text-purple-700">
            <i className="fas fa-graduation-cap mr-2 text-2xl"></i>
            <span className="text-2xl font-bold">Languruu</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("title")}</h1>
          <p className="text-gray-500 text-sm mb-8">{t("subtitle")}</p>

          <LoginForm />

          <p className="text-sm text-gray-500 mt-6 text-center">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-purple-600 font-medium hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
