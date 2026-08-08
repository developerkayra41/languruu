"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await forgotPasswordAction(email);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-green-500 text-4xl mb-3">
          <i className="fas fa-paper-plane"></i>
        </div>
        <p className="text-gray-600 text-sm">{t("sent")}</p>
        <Link
          href="/login"
          className="inline-block mt-4 text-purple-600 hover:underline text-sm"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ornek@mail.com"
        required
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
      <Link
        href="/login"
        className="block text-center text-sm text-gray-500 hover:underline"
      >
        {t("backToLogin")}
      </Link>
    </form>
  );
}
