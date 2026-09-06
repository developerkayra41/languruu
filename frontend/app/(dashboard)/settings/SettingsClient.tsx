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
  updatePresenceVisibilityAction,
} from "./actions";
import { PRESENCE_VISIBILITY_VALUES, type PresenceVisibility } from "@/app/types/social";

const presenceIcons: Record<PresenceVisibility, string> = {
  off: "fa-eye-slash",
  friends: "fa-user-group",
  everyone: "fa-globe",
};

export default function SettingsClient({
  currentEmail,
  hasPassword,
  presenceVisibility,
}: {
  currentEmail: string;
  hasPassword: boolean;
  presenceVisibility: PresenceVisibility;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [emailPending, startEmail] = useTransition();
  const [passwordPending, startPassword] = useTransition();
  const [logoutPending, startLogout] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [presencePending, startPresence] = useTransition();
  const { confirm, confirmDialog } = useConfirm();

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [presence, setPresence] = useState<PresenceVisibility>(presenceVisibility);

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

  const handlePresenceChange = (value: PresenceVisibility) => {
    if (value === presence || presencePending) return;
    const previous = presence;
    setPresence(value);
    startPresence(async () => {
      const r = await updatePresenceVisibilityAction(value);
      if (r.success) {
        toast.success(t("presenceUpdated"));
        router.refresh();
      } else {
        setPresence(previous);
        toast.error(r.error);
      }
    });
  };

  const handleLogoutAll = async () => {
    if (!(await confirm({ message: t("logoutAllConfirm") }))) return;
    startLogout(async () => {
      await logoutAllAction();
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
      if (r && !r.success) toast.error(r.error);
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
          {}
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

          {}
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

      {}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {t("presenceTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{t("presenceText")}</p>
        <div className="space-y-2">
          {PRESENCE_VISIBILITY_VALUES.map((value) => {
            const active = presence === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handlePresenceChange(value)}
                disabled={presencePending}
                aria-pressed={active}
                className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-lg border transition disabled:opacity-60 cursor-pointer ${
                  active
                    ? "border-purple-400 bg-purple-50 ring-1 ring-purple-200"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                    active ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <i className={`fas ${presenceIcons[value]} text-sm`}></i>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800">
                    {t(`presenceOption_${value}`)}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {t(`presenceHint_${value}`)}
                  </span>
                </span>
                {active && (
                  <i className="fas fa-check text-purple-600 text-sm ml-auto mt-1"></i>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          <i className="fas fa-circle-info mr-1"></i>
          {t("presenceAdminNote")}
        </p>
      </div>

      {}
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

      {}
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
