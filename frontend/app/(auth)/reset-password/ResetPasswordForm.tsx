"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resetPasswordAction } from "./actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.reset");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error(t("errInvalid")); return; }
    if (password.length < 6) { toast.error(t("errPassword")); return; }
    if (password !== confirm) { toast.error(t("errMatch")); return; }
    startTransition(async () => {
      const r = await resetPasswordAction(token, password);
      if (r.success) {
        toast.success(t("success"));
        router.push("/login");
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("newPassword")}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("confirm")}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
