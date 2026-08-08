"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { register } from "./actions";
import GoogleSignInButton from "@/app/components/auth/GoogleSignInButton";

export default function RegisterForm() {
  const t = useTranslations("auth.register");
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validate = (): string | null => {
    if (fullName.trim().length < 2) return t("errFullName");
    if (userName.length < 3 || userName.length > 16) return t("errUserNameLen");
    if (!/^[a-zA-Z0-9_]+$/.test(userName)) return t("errUserNameChars");
    if (!email.includes("@")) return t("errEmail");
    if (password.length < 6) return t("errPassword");
    if (password !== confirmPassword) return t("errMatch");
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!acceptedTerms) {
      toast.error(t("errTerms"));
      return;
    }

    startTransition(async () => {
      const result = await register({
        full_name: fullName,
        user_name: userName,
        email,
        password,
      });
      if (result && !result.success) toast.error(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("fullName")}
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Kayra Özgür"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("userName")}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            @
          </span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value.trim())}
            placeholder="kyr23"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("email")}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("password")}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("confirmPassword")}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("confirmPlaceholder")}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-400">{t("or")}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <GoogleSignInButton onError={(msg) => toast.error(msg)} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {t.rich("terms", {
            terms: (chunks) => (
              <Link href="/terms" target="_blank" className="text-purple-600 hover:underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" target="_blank" className="text-purple-600 hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
