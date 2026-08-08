"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/app/components/ui/useConfirm";
import {
  deleteAccountAction,
  logoutAllAction,
  updateEmailAction,
  updatePasswordAction,
} from "./actions";

export default function SettingsClient({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  // Her aksiyon için AYRI pending state — yoksa tek transition tüm butonları
  // aynı anda disable eder (Enter'da "iki buton tetiklenmiş gibi" görünür).
  const [emailPending, startEmail] = useTransition();
  const [passwordPending, startPassword] = useTransition();
  const [logoutPending, startLogout] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const { confirm, confirmDialog } = useConfirm();

  // E-posta formu
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Şifre formu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");

  const handleEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) {
      toast.error(t("errEmail"));
      return;
    }
    if (!emailPassword) {
      toast.error(t("errCurrentPassword"));
      return;
    }
    startEmail(async () => {
      const r = await updateEmailAction(newEmail, emailPassword);
      if (r.success) {
        toast.success(t("emailUpdated"));
        setNewEmail("");
        setEmailPassword("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t("errNewPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("errPasswordMatch"));
      return;
    }
    startPassword(async () => {
      const r = await updatePasswordAction(currentPassword, newPassword);
      if (r.success) {
        toast.success(t("passwordUpdated"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(r.error);
      }
    });
  };

  const handleLogoutAll = async () => {
    if (!(await confirm({ message: t("logoutAllConfirm") }))) return;
    startLogout(async () => {
      await logoutAllAction(); // başarıda /login'e yönlendirir
    });
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(hasPassword ? t("errDeletePassword") : t("errDeleteUsername"));
      return;
    }
    if (!(await confirm({ message: t("deleteConfirm"), danger: true }))) return;
    startDelete(async () => {
      const r = await deleteAccountAction(deletePassword);
      if (r && !r.success) toast.error(r.error); // başarıda zaten /login'e yönlenir
    });
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {confirmDialog}
      <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>

      {hasPassword ? (
        <>
          {/* E-posta */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {t("emailTitle")}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {t("current")}{" "}
              <span className="font-medium text-gray-700">
                {currentEmail || "—"}
              </span>
            </p>
            <form onSubmit={handleEmailUpdate} className="space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("newEmail")}
                className={inputClass}
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder={t("currentPasswordForEmail")}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={emailPending}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {t("updateEmail")}
              </button>
            </form>
          </div>

          {/* Şifre */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("passwordTitle")}
            </h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("currentPassword")}
                className={inputClass}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("newPassword")}
                className={inputClass}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPassword")}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={passwordPending}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {t("updatePassword")}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {t("accountTitle")}
          </h2>
          <p className="text-sm text-gray-500">
            <i className="fab fa-google mr-2 text-purple-600"></i>
            {t("googleNote")}
          </p>
        </div>
      )}

      {/* Güvenlik */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {t("securityTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{t("securityText")}</p>
        <button
          onClick={handleLogoutAll}
          disabled={logoutPending}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {t("logoutAll")}
        </button>
      </div>

      {/* Tehlikeli alan */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-1">
          {t("dangerTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{t("dangerText")}</p>
        <div className="space-y-3">
          <input
            type={hasPassword ? "password" : "text"}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder={
              hasPassword
                ? t("deletePasswordPlaceholder")
                : t("deleteUsernamePlaceholder")
            }
            className={inputClass}
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deletePending}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
