"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { login } from "./actions";
import GoogleSignInButton from "@/app/components/auth/GoogleSignInButton";
import Link from "next/link";

export default function LoginForm() {
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const validate = (): string | null => {
    if (!email.includes("@")) return t("errEmail");
    if (password.length < 6) return t("errPassword");
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    startTransition(async () => {
      const result = await login(email, password);
      if (result && !result.success) toast.error(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i
              className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
            ></i>
          </button>
        </div>
      </div>
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-purple-600 hover:underline"
        >
          {t("forgot")}
        </Link>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>

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
    </form>
  );
}
